"""生成 public/private_chef.db（无需 npm，仅需 Python 3）"""
import sqlite3
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(ROOT, 'public', 'private_chef.db')

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, type)
);

CREATE TABLE IF NOT EXISTS foods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  image TEXT,
  type TEXT NOT NULL,
  category_id INTEGER,
  status INTEGER DEFAULT 1,
  material TEXT,
  remark TEXT,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  food_id INTEGER NOT NULL,
  food_name TEXT NOT NULL,
  username TEXT NOT NULL,
  type TEXT NOT NULL,
  order_date TEXT NOT NULL,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS session (
  user_id INTEGER
);
"""

DEFAULT_CATEGORIES = {
    'breakfast': ['粥品', '蛋类', '饮品'],
    'lunch': ['热菜', '汤品'],
    'dinner': ['荤菜', '素菜', '汤品'],
}

SAMPLE_FOODS = [
    ('小米粥', 'breakfast', '粥品', '小米、红枣', '小火慢熬，可加冰糖'),
    ('煎蛋', 'breakfast', '蛋类', '鸡蛋、油、盐', '单面煎，蛋黄半熟'),
    ('豆浆', 'breakfast', '饮品', '黄豆、水', '现磨豆浆，少糖'),
    ('番茄炒蛋', 'lunch', '热菜', '番茄2个、鸡蛋3个、葱花', '先炒蛋盛出，再炒番茄'),
    ('青椒肉丝', 'lunch', '热菜', '猪肉、青椒、姜蒜', '肉丝先腌制10分钟'),
    ('紫菜蛋花汤', 'lunch', '汤品', '紫菜、鸡蛋、虾皮', '水开下紫菜，淋蛋花'),
    ('红烧肉', 'dinner', '荤菜', '五花肉、冰糖、生抽老抽', '小火慢炖1小时'),
    ('清炒时蔬', 'dinner', '素菜', '当季蔬菜、蒜', '大火快炒保持脆嫩'),
    ('冬瓜排骨汤', 'dinner', '汤品', '冬瓜、排骨、姜', '排骨焯水后炖40分钟'),
]

def main():
    force = '--force' in __import__('sys').argv
    if os.path.exists(DB_PATH) and not force:
        print(f'数据库已存在: {DB_PATH}')
        print('如需重建请执行: python scripts/init-db.py --force')
        return

    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)

    conn = sqlite3.connect(DB_PATH)
    conn.executescript(SCHEMA)
    conn.execute(
        "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
        ('admin', 'admin123', 'admin')
    )

    category_map = {}
    for meal_type, names in DEFAULT_CATEGORIES.items():
        for index, name in enumerate(names):
            cur = conn.execute(
                "INSERT INTO categories (name, type, sort_order) VALUES (?, ?, ?)",
                (name, meal_type, index)
            )
            category_map[f'{meal_type}:{name}'] = cur.lastrowid

    for name, meal_type, category, material, remark in SAMPLE_FOODS:
        category_id = category_map.get(f'{meal_type}:{category}')
        conn.execute(
            "INSERT INTO foods (name, type, category_id, status, material, remark) VALUES (?, ?, ?, 1, ?, ?)",
            (name, meal_type, category_id, material, remark)
        )

    conn.commit()
    conn.close()

    size = os.path.getsize(DB_PATH)
    print(f'已生成: {DB_PATH}')
    print(f'文件大小: {size} bytes')
    print('默认管理员: admin / admin123')
    print('示例类别: 早餐3类 / 午餐2类 / 晚餐3类')
    print('示例菜品: 9 道（早/中/晚各 3 道）')

if __name__ == '__main__':
    main()
