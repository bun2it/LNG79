import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const usage = () => {
  console.log(`
LNG79 CMS Supabase Backup Importer (Phase 15)
============================================
Usage:
  node scripts/import-backup.js [backup-file-path] [options]

Options:
  --dry-run          Preview the import, check validation and counts without database modifications.
  --skip-duplicates  Do not overwrite existing database records that have matching primary keys.
  --verbose          Print out the detailed SQL statements.
  --help             Show this usage guide.

Example:
  node scripts/import-backup.js lng79-cms-backup-2026-08-02T08-45-23-051Z.json --dry-run
  `);
  process.exit(0);
};

// Arguments parsing
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h') || args.length === 0) {
  usage();
}

const backupPath = args.find(a => !a.startsWith('--'));
const isDryRun = args.includes('--dry-run');
const skipDuplicates = args.includes('--skip-duplicates');
const isVerbose = args.includes('--verbose');

if (!backupPath) {
  console.error('Error: Please specify a backup file path.');
  process.exit(1);
}

// 1. Validation
console.log(`[1/5] Validating backup file: ${backupPath}...`);
if (!fs.existsSync(backupPath)) {
  console.error(`Error: Backup file not found at ${backupPath}`);
  process.exit(1);
}

let backup;
try {
  backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
} catch (err) {
  console.error('Error: Backup file is not valid JSON.', err.message);
  process.exit(1);
}

if (backup.format !== 'lng79-cms-backup') {
  console.error('Error: Unknown backup format. Must be "lng79-cms-backup".');
  process.exit(1);
}

console.log(`✔ Verified format: ${backup.format} (v${backup.version}) exported at ${backup.exportedAt}`);

const rawData = backup.data || {};
const parseJsonArray = (str) => {
  try {
    return str ? JSON.parse(str) : [];
  } catch {
    return [];
  }
};
const parseJsonObject = (str) => {
  try {
    return str ? JSON.parse(str) : {};
  } catch {
    return {};
  }
};

const products = parseJsonArray(rawData.cms_products);
const projects = parseJsonArray(rawData.cms_projects);
const articles = parseJsonArray(rawData.cms_articles);
const pages = parseJsonArray(rawData.cms_pages);
const contactInfo = parseJsonObject(rawData.cms_contact_info);
const menuItems = parseJsonArray(rawData.cms_menu);
const mediaAssets = parseJsonArray(rawData.cms_media);
const fuelSettings = parseJsonObject(rawData.cms_fuel_settings);
const pageHistory = parseJsonArray(rawData.cms_page_history);

console.log(`\nBackup contents:`);
console.log(`- Products: ${products.length}`);
console.log(`- Projects: ${projects.length}`);
console.log(`- Articles: ${articles.length}`);
console.log(`- Pages: ${pages.length}`);
console.log(`- Menu Items: ${menuItems.length}`);
console.log(`- Media Assets: ${mediaAssets.length}`);
console.log(`- Fuel Settings: ${Object.keys(fuelSettings).length ? 'Present' : 'Empty'}`);
console.log(`- Contact Info: ${Object.keys(contactInfo).length ? 'Present' : 'Empty'}`);
console.log(`- Page Revisions: ${pageHistory.length}`);

// Helper to escape single quotes for SQL insertion
const escapeSqlStr = (str) => {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
};

const escapeJsonb = (obj) => {
  if (obj === null || obj === undefined) return 'NULL';
  return `'${JSON.stringify(obj).replace(/'/g, "''")}'::jsonb`;
};

// 2. Fetch Existing IDs for Deduplication
console.log('\n[2/5] Fetching remote database state for deduplication check...');
const runQuery = (sql) => {
  try {
    const command = `supabase db query --linked "${sql.replace(/"/g, '\\"')}"`;
    const output = execSync(command, { stdio: ['pipe', 'pipe', 'ignore'], encoding: 'utf8' });
    const jsonStr = output.substring(output.indexOf('{'));
    return JSON.parse(jsonStr).rows || [];
  } catch (err) {
    console.warn('⚠️ Warning: Could not query database. Assuming tables are empty or unreachable.', err.message);
    return [];
  }
};

const existingProducts = runQuery("select id from public.products;").map(r => r.id);
const existingProjects = runQuery("select id from public.projects;").map(r => r.id);
const existingArticles = runQuery("select id from public.articles;").map(r => r.id);
const existingNav = runQuery("select id from public.navigation_items;").map(r => r.id);
const existingTexts = runQuery("select content_key from public.site_texts;").map(r => r.content_key);
const existingSettings = runQuery("select key from public.site_settings;").map(r => r.key);
const existingRevisions = runQuery("select id from public.page_revisions;").map(r => r.id);

const dupProducts = products.filter(p => existingProducts.includes(p.id));
const dupProjects = projects.filter(p => existingProjects.includes(p.id));
const dupArticles = articles.filter(a => existingArticles.includes(a.id));
const dupNav = menuItems.filter(m => existingNav.includes(m.id));
const dupRevisions = pageHistory.filter(h => existingRevisions.includes(h.id));

console.log(`\nDeduplication Audit:`);
console.log(`- Products: ${products.length - dupProducts.length} new, ${dupProducts.length} duplicates`);
console.log(`- Projects: ${projects.length - dupProjects.length} new, ${dupProjects.length} duplicates`);
console.log(`- Articles: ${articles.length - dupArticles.length} new, ${dupArticles.length} duplicates`);
console.log(`- Menu Items: ${menuItems.length - dupNav.length} new, ${dupNav.length} duplicates`);
console.log(`- Page Revisions: ${pageHistory.length - dupRevisions.length} new, ${dupRevisions.length} duplicates`);

// 3. Compile SQL Queries
console.log('\n[3/5] Compiling SQL statements...');
const sqlStatements = [];

// Disable Triggers temporarily to avoid updated_at conflicts
sqlStatements.push('SET session_replication_role = replica;');

// Products
products.forEach((p) => {
  const isDup = existingProducts.includes(p.id);
  if (isDup && skipDuplicates) return;

  sqlStatements.push(`
    INSERT INTO public.products (id, name, category, specs, origin, details, tech_params, image, visible, sort_order)
    VALUES (
      ${escapeSqlStr(p.id)},
      ${escapeJsonb(p.name)},
      ${escapeSqlStr(p.category)},
      ${escapeJsonb(p.specs)},
      ${escapeSqlStr(p.origin)},
      ${escapeJsonb(p.details)},
      ${escapeJsonb(p.techParams || [])},
      ${escapeSqlStr(p.image || null)},
      ${p.visible !== false},
      0
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      category = EXCLUDED.category,
      specs = EXCLUDED.specs,
      origin = EXCLUDED.origin,
      details = EXCLUDED.details,
      tech_params = EXCLUDED.tech_params,
      image = COALESCE(EXCLUDED.image, public.products.image),
      visible = EXCLUDED.visible;
  `);
});

// Projects
projects.forEach((p) => {
  const isDup = existingProjects.includes(p.id);
  if (isDup && skipDuplicates) return;

  sqlStatements.push(`
    INSERT INTO public.projects (id, name, category, location, scope, capacity, result, equipments, image, visible, sort_order)
    VALUES (
      ${escapeSqlStr(p.id)},
      ${escapeJsonb(p.name)},
      ${escapeSqlStr(p.category)},
      ${escapeJsonb(p.location)},
      ${escapeJsonb(p.scope)},
      ${escapeJsonb(p.capacity)},
      ${escapeJsonb(p.result)},
      ${escapeJsonb(p.equipments || [])},
      ${escapeSqlStr(p.image || null)},
      ${p.visible !== false},
      0
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      category = EXCLUDED.category,
      location = EXCLUDED.location,
      scope = EXCLUDED.scope,
      capacity = EXCLUDED.capacity,
      result = EXCLUDED.result,
      equipments = EXCLUDED.equipments,
      image = COALESCE(EXCLUDED.image, public.projects.image),
      visible = EXCLUDED.visible;
  `);
});

// Articles
articles.forEach((a) => {
  const isDup = existingArticles.includes(a.id);
  if (isDup && skipDuplicates) return;

  sqlStatements.push(`
    INSERT INTO public.articles (id, title, category, excerpt, content, date, image, visible, sort_order)
    VALUES (
      ${escapeSqlStr(a.id)},
      ${escapeJsonb(a.title)},
      ${escapeSqlStr(a.category)},
      ${escapeJsonb(a.excerpt)},
      ${escapeJsonb(a.content)},
      ${escapeSqlStr(a.date)},
      ${escapeSqlStr(a.image || null)},
      ${a.visible !== false},
      0
    )
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      category = EXCLUDED.category,
      excerpt = EXCLUDED.excerpt,
      content = EXCLUDED.content,
      date = EXCLUDED.date,
      image = COALESCE(EXCLUDED.image, public.articles.image),
      visible = EXCLUDED.visible;
  `);
});

// Navigation Items (Flatten hierarchical menu structure)
const flattenedNav = [];
menuItems.forEach((m, idx) => {
  flattenedNav.push({
    id: m.id,
    label: m.label,
    path: m.link,
    sort_order: idx,
    visible: m.visible !== false,
    target: m.target || '_self',
    parent_id: null
  });
  if (m.children) {
    m.children.forEach((child, childIdx) => {
      flattenedNav.push({
        id: child.id,
        label: child.label,
        path: child.link,
        sort_order: childIdx,
        visible: child.visible !== false,
        target: child.target || '_self',
        parent_id: m.id
      });
    });
  }
});

flattenedNav.forEach((n) => {
  const isDup = existingNav.includes(n.id);
  if (isDup && skipDuplicates) return;

  sqlStatements.push(`
    INSERT INTO public.navigation_items (id, label, path, sort_order, visible, target, parent_id)
    VALUES (
      ${escapeSqlStr(n.id)},
      ${escapeJsonb(n.label)},
      ${escapeSqlStr(n.path)},
      ${n.sort_order},
      ${n.visible},
      ${escapeSqlStr(n.target)},
      ${escapeSqlStr(n.parent_id)}
    )
    ON CONFLICT (id) DO UPDATE SET
      label = EXCLUDED.label,
      path = EXCLUDED.path,
      sort_order = EXCLUDED.sort_order,
      visible = EXCLUDED.visible,
      target = EXCLUDED.target,
      parent_id = EXCLUDED.parent_id;
  `);
});

// Site Settings
if (Object.keys(contactInfo).length > 0) {
  const isDup = existingSettings.includes('contact_info');
  if (!(isDup && skipDuplicates)) {
    sqlStatements.push(`
      INSERT INTO public.site_settings (key, value)
      VALUES ('contact_info', ${escapeJsonb(contactInfo)})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
    `);
  }
}

if (Object.keys(fuelSettings).length > 0) {
  const isDup = existingSettings.includes('fuel_settings');
  if (!(isDup && skipDuplicates)) {
    sqlStatements.push(`
      INSERT INTO public.site_settings (key, value)
      VALUES ('fuel_settings', ${escapeJsonb(fuelSettings)})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
    `);
  }
}

// Site Texts (Extract fields from page layouts)
pages.forEach((page) => {
  if (!page.blocks) return;
  page.blocks.forEach((block) => {
    const prefix = `${page.slug || 'home'}.block.${block.id}`;
    
    const fieldsToProcess = ['title', 'subtitle', 'cta', 'items', 'content'];
    fieldsToProcess.forEach((fieldBase) => {
      const fieldVi = `${fieldBase}Vi`;
      const fieldEn = `${fieldBase}En`;
      
      if (block[fieldVi] !== undefined || block[fieldEn] !== undefined) {
        const contentKey = `${prefix}.${fieldBase}`;
        const isDup = existingTexts.includes(contentKey);
        if (isDup && skipDuplicates) return;

        sqlStatements.push(`
          INSERT INTO public.site_texts (content_key, page, section, field, status, value_vi, value_en)
          VALUES (
            ${escapeSqlStr(contentKey)},
            ${escapeSqlStr(page.slug || 'home')},
            'block',
            ${escapeSqlStr(block.id)},
            'published',
            ${escapeSqlStr(block[fieldVi] || '')},
            ${escapeSqlStr(block[fieldEn] || '')}
          )
          ON CONFLICT (content_key) DO UPDATE SET
            value_vi = EXCLUDED.value_vi,
            value_en = EXCLUDED.value_en;
        `);
      }
    });
  });
});

// Page Revisions
pageHistory.forEach((h) => {
  const isDup = existingRevisions.includes(h.id);
  if (isDup && skipDuplicates) return;

  sqlStatements.push(`
    INSERT INTO public.page_revisions (id, page_id, timestamp, author, blocks)
    VALUES (
      ${escapeSqlStr(h.id)},
      ${escapeSqlStr(h.pageId)},
      ${escapeSqlStr(h.timestamp)},
      ${escapeSqlStr(h.author || 'admin')},
      ${escapeJsonb(h.blocks || [])}
    )
    ON CONFLICT (id) DO UPDATE SET
      page_id = EXCLUDED.page_id,
      timestamp = EXCLUDED.timestamp,
      author = EXCLUDED.author,
      blocks = EXCLUDED.blocks;
  `);
});

// Re-enable triggers
sqlStatements.push('SET session_replication_role = DEFAULT;');

const finalSql = sqlStatements.join('\n');

// 4. Execution / Dry Run Report
console.log('\n[4/5] Executing Action...');
if (isDryRun) {
  console.log('⚡ [DRY-RUN MODE] Preview of SQL statements:');
  console.log(`Generated ${sqlStatements.length - 2} data migration commands.`);
  if (isVerbose) {
    console.log('\n--- COMPILED SQL OUTPUT ---');
    console.log(finalSql);
    console.log('---------------------------');
  }
  console.log('\n✔ Dry run finished successfully. No database rows were affected.');
  process.exit(0);
}

// Write compiled SQL to scratch directory for audit
const scratchDir = path.join(process.cwd(), 'scratch');
if (!fs.existsSync(scratchDir)) {
  fs.mkdirSync(scratchDir);
}
const sqlTempPath = path.join(scratchDir, 'temp_import.sql');
fs.writeFileSync(sqlTempPath, finalSql, 'utf8');

try {
  console.log('Applying compiled migration to the remote Supabase database...');
  execSync(`supabase db query --linked --file "${sqlTempPath}"`, { stdio: 'inherit' });
  console.log('\n[5/5] Importer execution summary:');
  console.log('✔ All backup entries have been imported and synchronized.');
} catch (err) {
  console.error('\n❌ Error: Failed to execute compiled migration SQL on Supabase.', err.message);
  process.exit(1);
} finally {
  if (fs.existsSync(sqlTempPath)) {
    fs.unlinkSync(sqlTempPath);
  }
}
