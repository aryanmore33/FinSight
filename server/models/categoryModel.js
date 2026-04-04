const pool = require("../config/pool");

const createCategory = async (
  userId,
  name,
  type = "expense",
  color = null,
  icon = null
) => {
  try {
    if (!userId || !name) {
      throw new Error("userId and name are required to create a category");
    }

    const normalizedName = name.trim();
    if (!normalizedName) {
      throw new Error("Category name cannot be empty");
    }

    if (!["income", "expense"].includes(type)) {
      type = "expense";
    }

    const existing = await pool.query(
      `SELECT * FROM categories WHERE user_id = $1 AND name = $2 AND type = $3`,
      [userId, normalizedName, type]
    );

    if (existing.rows[0]) {
      if (existing.rows[0].is_deleted) {
        const restored = await pool.query(
          `UPDATE categories SET is_deleted = false, color = $2, icon = $3, updated_at = NOW() WHERE id = $1 RETURNING *`,
          [existing.rows[0].id, color, icon]
        );
        return restored.rows[0];
      }
      return existing.rows[0];
    }

    const result = await pool.query(
      `INSERT INTO categories (user_id, name, type, color, icon, is_deleted, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, false, NOW(), NOW())
       RETURNING *`,
      [userId, normalizedName, type, color, icon]
    );

    return result.rows[0];
  } catch (err) {
    console.error("Error creating category:", err);
    throw err;
  }
};

const getCategoriesByUserId = async (userId) => {
  try {
    const query = `
      SELECT id, user_id, name, type, color, icon, created_at, updated_at
      FROM categories
      WHERE user_id = $1 AND is_deleted = false
      ORDER BY name ASC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (err) {
    console.error("Error getting categories by userId:", err);
    throw err;
  }
};

const getCategoryById = async (id, userId) => {
  try {
    const query = `
      SELECT id, user_id, name, type, color, icon, created_at, updated_at
      FROM categories
      WHERE id = $1 AND user_id = $2 AND is_deleted = false
    `;
    const result = await pool.query(query, [id, userId]);
    return result.rows[0] || null;
  } catch (err) {
    console.error("Error getting category by id:", err);
    throw err;
  }
};

const updateCategory = async (id, userId, data) => {
  try {
    const fields = [];
    const params = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramIndex}`);
      params.push(data.name.trim());
      paramIndex++;
    }

    if (data.type !== undefined) {
      if (!["income", "expense"].includes(data.type)) {
        throw new Error("type must be 'income' or 'expense'");
      }
      fields.push(`type = $${paramIndex}`);
      params.push(data.type);
      paramIndex++;
    }

    if (data.color !== undefined) {
      fields.push(`color = $${paramIndex}`);
      params.push(data.color);
      paramIndex++;
    }

    if (data.icon !== undefined) {
      fields.push(`icon = $${paramIndex}`);
      params.push(data.icon);
      paramIndex++;
    }

    if (fields.length === 0) {
      throw new Error("No valid fields provided to update");
    }

    fields.push(`updated_at = NOW()`);
    params.push(id, userId);

    const query = `
      UPDATE categories
      SET ${fields.join(", ")}
      WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1} AND is_deleted = false
      RETURNING id, user_id, name, type, color, icon, created_at, updated_at
    `;

    const result = await pool.query(query, params);
    return result.rows[0] || null;
  } catch (err) {
    console.error("Error updating category:", err);
    throw err;
  }
};

const deleteCategory = async (id, userId) => {
  try {
    const result = await pool.query(
      `UPDATE categories SET is_deleted = true, updated_at = NOW() WHERE id = $1 AND user_id = $2 AND is_deleted = false RETURNING id`,
      [id, userId]
    );
    return result.rows[0] || null;
  } catch (err) {
    console.error("Error deleting category:", err);
    throw err;
  }
};

const findOrCreateCategories = async (userId, categoryNames = [], defaultType = "expense") => {
  try {
    if (!Array.isArray(categoryNames) || categoryNames.length === 0) {
      return {};
    }

    const normalizedEntries = {};
    categoryNames.forEach((item) => {
      if (!item) return;

      const entry =
        typeof item === "string"
          ? { name: item.trim(), type: defaultType }
          : {
              name: item.name?.trim(),
              type: item.type || defaultType,
            };

      if (!entry.name) return;
      if (!["income", "expense"].includes(entry.type)) {
        entry.type = defaultType;
      }

      const key = `${entry.name.toLowerCase()}|${entry.type}`;
      normalizedEntries[key] = entry;
    });

    const map = {};

    for (const key of Object.keys(normalizedEntries)) {
      const entry = normalizedEntries[key];

      const existing = await pool.query(
        `SELECT id, is_deleted FROM categories WHERE user_id = $1 AND name = $2 AND type = $3`,
        [userId, entry.name, entry.type]
      );

      if (existing.rows[0]) {
        if (existing.rows[0].is_deleted) {
          const restored = await pool.query(
            `UPDATE categories SET is_deleted = false, updated_at = NOW() WHERE id = $1 RETURNING id`,
            [existing.rows[0].id]
          );
          map[key] = restored.rows[0].id;
        } else {
          map[key] = existing.rows[0].id;
        }
        continue;
      }

      const created = await pool.query(
        `INSERT INTO categories (user_id, name, type, is_deleted, created_at, updated_at)
         VALUES ($1, $2, $3, false, NOW(), NOW()) RETURNING id`,
        [userId, entry.name, entry.type]
      );
      map[key] = created.rows[0].id;
    }

    return map;
  } catch (err) {
    console.error("Error finding or creating categories:", err);
    throw err;
  }
};

module.exports = {
  createCategory,
  getCategoriesByUserId,
  getCategoryById,
  updateCategory,
  deleteCategory,
  findOrCreateCategories,
};
