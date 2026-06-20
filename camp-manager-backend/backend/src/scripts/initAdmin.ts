import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function initAdmin() {
  try {
    const count = await prisma.user.count()
    if (count > 0) return

    const hash = await bcrypt.hash('Admin1234!', 12)
    await prisma.user.create({
      data: {
        nom: 'Système',
        prenom: 'Admin',
        email: 'admin@camp.cm',
        motDePasseHash: hash,
        role: Role.SUPER_ADMIN,
      },
    })
    console.log('✅ Compte admin créé : admin@camp.cm / Admin1234!')
  } catch (e) {
    console.error('initAdmin error:', e)
  } finally {
    await prisma.$disconnect()
  }
}
