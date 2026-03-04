import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { listings: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        children: { where: { isActive: true } },
        parent: true,
      },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async findById(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async getTree() {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true, parentId: null },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            _count: { select: { listings: true } },
          },
        },
        _count: { select: { listings: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
    return categories;
  }

  async seed() {
    const categories = [
      {
        name: 'Shop Market',
        slug: 'shop-market',
        icon: '🛒',
        children: [
          { name: 'Vêtements', slug: 'vetements', icon: '👕' },
          { name: 'Accessoires', slug: 'accessoires', icon: '👜' },
          { name: 'Maison & Jardin', slug: 'maison-jardin', icon: '🏠' },
          { name: 'Sports & Loisirs', slug: 'sports-loisirs', icon: '⚽' },
        ],
      },
      {
        name: 'Foods',
        slug: 'foods',
        icon: '🍽️',
        children: [
          { name: 'Produits frais', slug: 'produits-frais', icon: '🥬' },
          { name: 'Épicerie', slug: 'epicerie', icon: '🧺' },
          { name: 'Pâtisserie', slug: 'patisserie', icon: '🧁' },
          { name: 'Traiteur', slug: 'traiteur', icon: '🍲' },
        ],
      },
      {
        name: 'Automobile',
        slug: 'automobile',
        icon: '🚗',
        children: [
          { name: 'Voitures', slug: 'voitures', icon: '🚙' },
          { name: 'Motos', slug: 'motos', icon: '🏍️' },
          { name: 'Pièces détachées', slug: 'pieces-detachees', icon: '🔧' },
          { name: 'Utilitaires', slug: 'utilitaires', icon: '🚐' },
        ],
      },
      {
        name: 'High Tech',
        slug: 'high-tech',
        icon: '💻',
        children: [
          { name: 'Smartphones', slug: 'smartphones', icon: '📱' },
          { name: 'Ordinateurs', slug: 'ordinateurs', icon: '🖥️' },
          { name: 'Tablettes', slug: 'tablettes', icon: '📟' },
          { name: 'Accessoires Tech', slug: 'accessoires-tech', icon: '🎧' },
        ],
      },
    ];

    for (const cat of categories) {
      const parent = await this.prisma.category.upsert({
        where: { slug: cat.slug },
        update: { name: cat.name, icon: cat.icon },
        create: {
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon,
          sortOrder: categories.indexOf(cat),
        },
      });

      if (cat.children) {
        for (const child of cat.children) {
          await this.prisma.category.upsert({
            where: { slug: child.slug },
            update: { name: child.name, icon: child.icon, parentId: parent.id },
            create: {
              name: child.name,
              slug: child.slug,
              icon: child.icon,
              parentId: parent.id,
              sortOrder: cat.children.indexOf(child),
            },
          });
        }
      }
    }

    return { message: 'Categories seeded successfully' };
  }
}
