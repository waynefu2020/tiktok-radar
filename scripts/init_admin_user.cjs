#!/usr/bin/env node
/**
 * 初始化首个管理员账号
 * 用法：node scripts/init_admin_user.cjs <username> <password> [display_name]
 * 示例：node scripts/init_admin_user.cjs admin StrongPass123 管理员
 */

const bcrypt = require('bcryptjs')
const { userExists, createUser, DB_PATH } = require('../db.cjs')

const BCRYPT_SALT_ROUNDS = 10

async function main() {
  const username = String(process.argv[2] || '').trim().toLowerCase()
  const password = String(process.argv[3] || '')
  const displayName = String(process.argv[4] || '').trim()

  if (!username || !password) {
    console.error('用法: node scripts/init_admin_user.cjs <username> <password> [display_name]')
    process.exit(1)
  }

  if (password.length < 6) {
    console.error('错误: 密码至少6位')
    process.exit(1)
  }

  if (userExists()) {
    console.error(`错误: 当前数据库已存在用户，请改用重置密码或用户管理功能。DB_PATH=${DB_PATH}`)
    process.exit(1)
  }

  try {
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS)
    const user = createUser({
      username,
      passwordHash,
      role: 'admin',
      displayName: displayName || username,
    })

    console.log(`✅ 已创建首个管理员账号: ${user.username}`)
    console.log(`   角色: ${user.role}`)
    console.log(`   数据库: ${DB_PATH}`)
  } catch (err) {
    console.error('错误:', err.message)
    process.exit(1)
  }
}

main()
