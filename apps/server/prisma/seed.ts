import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import path from 'path'

// Load .env
const envPath = path.resolve(__dirname, '../.env')
dotenv.config({ path: envPath })

// Prisma 7: DATABASE_URL is read from environment automatically
const prisma = new PrismaClient()

const commonAllergens = [
  ['Gluten', 'Dairy'],
  ['Dairy', 'Eggs'],
  ['Nuts', 'Soy'],
  ['Gluten', 'Dairy', 'Eggs'],
  ['Fish', 'Shellfish'],
  ['Sesame'],
  ['Dairy'],
  ['Gluten'],
  ['Nuts', 'Dairy'],
  ['Eggs', 'Dairy', 'Gluten']
]

const categoryData = [
  {
    name: 'Appetizers',
    products: [
      { name: 'Bruschetta Trio', description: 'Three varieties of bruschetta with fresh tomatoes, basil, mozzarella, and roasted peppers. Served on toasted artisan bread with a drizzle of balsamic glaze.', price: 12.99 },
      { name: 'Crispy Calamari', description: 'Tender rings of squid lightly battered and fried to golden perfection. Served with marinara sauce and lemon aioli for dipping.', price: 14.99 },
      { name: 'Spinach Artichoke Dip', description: 'Creamy blend of spinach, artichokes, and three cheeses baked until bubbly. Served with warm tortilla chips and fresh vegetables.', price: 11.99 },
      { name: 'Chicken Wings', description: 'Jumbo chicken wings tossed in your choice of buffalo, BBQ, or honey garlic sauce. Served with celery sticks and blue cheese dressing.', price: 13.99 },
      { name: 'Mozzarella Sticks', description: 'Golden fried mozzarella sticks with a crispy breadcrumb coating. Served with marinara sauce for dipping.', price: 9.99 },
      { name: 'Shrimp Cocktail', description: 'Chilled jumbo shrimp served with our signature cocktail sauce and fresh lemon wedges. A classic appetizer.', price: 16.99 },
      { name: 'Loaded Nachos', description: 'Crispy tortilla chips topped with melted cheese, jalapeños, black beans, sour cream, guacamole, and pico de gallo.', price: 12.99 },
      { name: 'Stuffed Mushrooms', description: 'Button mushrooms stuffed with herbed cream cheese and breadcrumbs, baked until golden and tender.', price: 10.99 },
      { name: 'Onion Rings', description: 'Thick-cut onion rings battered and fried to crispy perfection. Served with chipotle aioli dipping sauce.', price: 8.99 },
      { name: 'Caprese Salad', description: 'Fresh mozzarella, ripe tomatoes, and basil drizzled with extra virgin olive oil and balsamic reduction.', price: 11.99 }
    ]
  },
  {
    name: 'Salads',
    products: [
      { name: 'Caesar Salad', description: 'Crisp romaine lettuce tossed with our house-made Caesar dressing, parmesan cheese, croutons, and fresh cracked black pepper.', price: 10.99 },
      { name: 'Greek Salad', description: 'Mixed greens topped with feta cheese, kalamata olives, cucumbers, tomatoes, red onions, and our tangy Greek vinaigrette.', price: 11.99 },
      { name: 'Cobb Salad', description: 'Fresh mixed greens with grilled chicken, crispy bacon, hard-boiled eggs, avocado, tomatoes, and blue cheese crumbles.', price: 13.99 },
      { name: 'Asian Chicken Salad', description: 'Mixed greens with grilled chicken, mandarin oranges, crispy wontons, almonds, and sesame ginger dressing.', price: 12.99 },
      { name: 'Mediterranean Salad', description: 'Arugula and spinach with grilled vegetables, chickpeas, feta cheese, and a lemon herb vinaigrette.', price: 11.99 },
      { name: 'Southwest Salad', description: 'Mixed greens with black beans, corn, tomatoes, avocado, tortilla strips, and chipotle ranch dressing.', price: 12.99 },
      { name: 'Waldorf Salad', description: 'Crisp apples, celery, grapes, and walnuts mixed with mayonnaise and served on a bed of lettuce.', price: 10.99 },
      { name: 'Spinach Salad', description: 'Fresh baby spinach with strawberries, goat cheese, candied pecans, and poppy seed dressing.', price: 11.99 },
      { name: 'Chef Salad', description: 'Mixed greens with ham, turkey, cheese, hard-boiled eggs, and your choice of dressing.', price: 12.99 },
      { name: 'Arugula & Pear Salad', description: 'Peppery arugula with sliced pears, gorgonzola cheese, walnuts, and a honey balsamic vinaigrette.', price: 11.99 }
    ]
  },
  {
    name: 'Burgers',
    products: [
      { name: 'Classic Burger', description: 'Juicy beef patty on a toasted brioche bun with lettuce, tomato, onion, pickles, and our signature sauce. Served with fries.', price: 14.99 },
      { name: 'Bacon Cheeseburger', description: 'Our classic burger topped with crispy bacon, cheddar cheese, lettuce, tomato, and special sauce.', price: 16.99 },
      { name: 'Mushroom Swiss Burger', description: 'Beef patty topped with sautéed mushrooms, Swiss cheese, caramelized onions, and garlic aioli.', price: 15.99 },
      { name: 'BBQ Burger', description: 'Grilled burger with crispy onion rings, cheddar cheese, bacon, and tangy BBQ sauce.', price: 15.99 },
      { name: 'Veggie Burger', description: 'House-made veggie patty with avocado, sprouts, tomato, and herb mayo on a whole grain bun.', price: 13.99 },
      { name: 'Turkey Burger', description: 'Lean turkey patty with cranberry aioli, arugula, and provolone cheese on a multigrain bun.', price: 14.99 },
      { name: 'Chicken Burger', description: 'Grilled chicken breast with lettuce, tomato, red onion, and chipotle mayo on a brioche bun.', price: 13.99 },
      { name: 'Double Stack Burger', description: 'Two beef patties with double cheese, lettuce, tomato, pickles, and special sauce.', price: 17.99 },
      { name: 'Hawaiian Burger', description: 'Beef patty with grilled pineapple, teriyaki glaze, Swiss cheese, and crispy onions.', price: 15.99 },
      { name: 'Breakfast Burger', description: 'Beef patty topped with a fried egg, crispy hash browns, bacon, and cheddar cheese.', price: 16.99 }
    ]
  },
  {
    name: 'Pizza',
    products: [
      { name: 'Margherita', description: 'Classic pizza with fresh mozzarella, tomato sauce, basil leaves, and a drizzle of olive oil. Simple and delicious.', price: 12.99 },
      { name: 'Pepperoni', description: 'Traditional pepperoni pizza with mozzarella cheese and our house-made tomato sauce.', price: 14.99 },
      { name: 'Hawaiian', description: 'Ham, pineapple, and mozzarella cheese on our signature pizza crust. A tropical favorite.', price: 15.99 },
      { name: 'Meat Lovers', description: 'Loaded with pepperoni, Italian sausage, bacon, ham, and mozzarella cheese.', price: 17.99 },
      { name: 'Vegetarian', description: 'Fresh vegetables including bell peppers, mushrooms, onions, olives, and tomatoes with mozzarella.', price: 14.99 },
      { name: 'BBQ Chicken', description: 'Grilled chicken, red onions, cilantro, and BBQ sauce with mozzarella cheese.', price: 16.99 },
      { name: 'Four Cheese', description: 'Mozzarella, gorgonzola, parmesan, and fontina cheeses on a white sauce base.', price: 15.99 },
      { name: 'Supreme', description: 'Pepperoni, Italian sausage, green peppers, mushrooms, onions, and black olives.', price: 16.99 },
      { name: 'White Pizza', description: 'Ricotta, mozzarella, and parmesan cheeses with garlic, spinach, and olive oil.', price: 15.99 },
      { name: 'Buffalo Chicken', description: 'Spicy buffalo chicken, red onions, blue cheese crumbles, and ranch drizzle.', price: 16.99 }
    ]
  },
  {
    name: 'Pasta',
    products: [
      { name: 'Spaghetti Carbonara', description: 'Classic Italian pasta with crispy pancetta, eggs, parmesan cheese, and black pepper. Rich and creamy.', price: 16.99 },
      { name: 'Fettuccine Alfredo', description: 'Fresh fettuccine noodles tossed in a creamy parmesan sauce with garlic and herbs.', price: 15.99 },
      { name: 'Lasagna', description: 'Layers of pasta, ground beef, ricotta, mozzarella, and marinara sauce baked to perfection.', price: 17.99 },
      { name: 'Penne Arrabbiata', description: 'Penne pasta in a spicy tomato sauce with garlic, red chili peppers, and fresh basil.', price: 14.99 },
      { name: 'Chicken Parmesan', description: 'Breaded chicken breast topped with marinara and mozzarella, served over spaghetti.', price: 18.99 },
      { name: 'Shrimp Scampi', description: 'Linguine pasta with succulent shrimp, garlic, white wine, lemon, and butter sauce.', price: 19.99 },
      { name: 'Bolognese', description: 'Slow-cooked meat sauce with ground beef, tomatoes, and herbs served over tagliatelle.', price: 17.99 },
      { name: 'Pesto Pasta', description: 'Fresh basil pesto with pine nuts, parmesan, and olive oil tossed with your choice of pasta.', price: 15.99 },
      { name: 'Mac & Cheese', description: 'Creamy macaroni with a blend of cheeses, topped with breadcrumbs and baked until golden.', price: 13.99 },
      { name: 'Seafood Linguine', description: 'Linguine with a medley of fresh seafood in a white wine and garlic sauce.', price: 21.99 }
    ]
  },
  {
    name: 'Seafood',
    products: [
      { name: 'Grilled Salmon', description: 'Fresh Atlantic salmon grilled to perfection, served with roasted vegetables and lemon butter sauce.', price: 24.99 },
      { name: 'Fish & Chips', description: 'Beer-battered cod with crispy fries, coleslaw, and tartar sauce. A British classic.', price: 16.99 },
      { name: 'Lobster Roll', description: 'Fresh lobster meat mixed with mayo and herbs, served in a buttered roll with fries.', price: 28.99 },
      { name: 'Shrimp Scampi', description: 'Large shrimp sautéed in garlic, white wine, and butter, served over pasta or rice.', price: 22.99 },
      { name: 'Crab Cakes', description: 'Jumbo lump crab cakes pan-seared until golden, served with remoulade sauce and lemon.', price: 23.99 },
      { name: 'Tuna Steak', description: 'Seared tuna steak with a sesame crust, served with wasabi aioli and pickled ginger.', price: 25.99 },
      { name: 'Fish Tacos', description: 'Grilled white fish in soft tortillas with cabbage slaw, avocado, and chipotle crema.', price: 15.99 },
      { name: 'Seafood Paella', description: 'Traditional Spanish rice dish with shrimp, mussels, clams, and chorizo.', price: 26.99 },
      { name: 'Linguine alle Vongole', description: 'Linguine pasta with fresh clams in a white wine and garlic sauce.', price: 20.99 },
      { name: 'Coconut Shrimp', description: 'Crispy coconut-breaded shrimp served with sweet chili dipping sauce.', price: 18.99 }
    ]
  },
  {
    name: 'Steaks',
    products: [
      { name: 'Ribeye Steak', description: 'Prime ribeye steak grilled to your preference, served with garlic mashed potatoes and seasonal vegetables.', price: 32.99 },
      { name: 'Filet Mignon', description: 'Tender filet mignon cooked to perfection, served with roasted potatoes and béarnaise sauce.', price: 34.99 },
      { name: 'New York Strip', description: 'Well-marbled strip steak grilled and served with loaded baked potato and asparagus.', price: 30.99 },
      { name: 'T-Bone Steak', description: 'Large T-bone steak combining the flavors of strip and tenderloin, served with fries.', price: 35.99 },
      { name: 'Porterhouse', description: 'Massive porterhouse steak for two, grilled and served with two sides of your choice.', price: 68.99 },
      { name: 'Sirloin Steak', description: 'Juicy sirloin steak with peppercorn sauce, served with mashed potatoes and green beans.', price: 26.99 },
      { name: 'Steak Frites', description: 'Tender steak served with crispy French fries and garlic aioli.', price: 28.99 },
      { name: 'Surf & Turf', description: 'Filet mignon paired with a lobster tail, served with drawn butter and two sides.', price: 42.99 },
      { name: 'Ribeye Sandwich', description: 'Sliced ribeye on a toasted roll with caramelized onions and horseradish aioli.', price: 18.99 },
      { name: 'Steak Salad', description: 'Grilled sirloin strips over mixed greens with blue cheese, tomatoes, and red wine vinaigrette.', price: 22.99 }
    ]
  },
  {
    name: 'Desserts',
    products: [
      { name: 'Chocolate Lava Cake', description: 'Warm chocolate cake with a molten center, served with vanilla ice cream and fresh berries.', price: 9.99 },
      { name: 'New York Cheesecake', description: 'Creamy classic cheesecake with a graham cracker crust, topped with your choice of berry compote.', price: 8.99 },
      { name: 'Tiramisu', description: 'Traditional Italian dessert with layers of coffee-soaked ladyfingers and mascarpone cream.', price: 9.99 },
      { name: 'Apple Pie', description: 'Homemade apple pie with a flaky crust, served warm with vanilla ice cream and caramel drizzle.', price: 7.99 },
      { name: 'Brownie Sundae', description: 'Warm fudge brownie topped with vanilla ice cream, hot fudge, whipped cream, and a cherry.', price: 8.99 },
      { name: 'Crème Brûlée', description: 'Classic French custard with a caramelized sugar top, served with fresh berries.', price: 9.99 },
      { name: 'Key Lime Pie', description: 'Tangy key lime pie with a graham cracker crust and whipped cream topping.', price: 7.99 },
      { name: 'Ice Cream Sampler', description: 'Three scoops of house-made ice cream with your choice of flavors and toppings.', price: 8.99 },
      { name: 'Chocolate Chip Cookies', description: 'Warm, gooey chocolate chip cookies served with a glass of cold milk.', price: 6.99 },
      { name: 'Bread Pudding', description: 'Warm bread pudding with vanilla sauce and a sprinkle of cinnamon.', price: 7.99 }
    ]
  },
  {
    name: 'Beverages',
    products: [
      { name: 'Fresh Lemonade', description: 'House-made lemonade with fresh squeezed lemons, served over ice with a lemon wedge.', price: 4.99 },
      { name: 'Iced Tea', description: 'Freshly brewed iced tea, sweetened or unsweetened, served with lemon.', price: 3.99 },
      { name: 'Fresh Orange Juice', description: 'Freshly squeezed orange juice, served chilled.', price: 5.99 },
      { name: 'Soda', description: 'Assorted soft drinks including cola, lemon-lime, and root beer.', price: 2.99 },
      { name: 'Sparkling Water', description: 'Refreshing sparkling water with a slice of lemon or lime.', price: 3.99 },
      { name: 'Coffee', description: 'Freshly brewed coffee, served hot with cream and sugar on the side.', price: 3.49 },
      { name: 'Cappuccino', description: 'Espresso with steamed milk and a layer of foam, dusted with cocoa.', price: 4.99 },
      { name: 'Latte', description: 'Espresso with steamed milk, available in various flavors like vanilla, caramel, or hazelnut.', price: 5.49 },
      { name: 'Milkshake', description: 'Thick and creamy milkshake available in chocolate, vanilla, or strawberry.', price: 6.99 },
      { name: 'Smoothie', description: 'Blended fruit smoothie with your choice of strawberries, bananas, or mixed berries.', price: 6.99 }
    ]
  },
  {
    name: 'Sides',
    products: [
      { name: 'French Fries', description: 'Crispy golden fries seasoned with sea salt, served with ketchup.', price: 4.99 },
      { name: 'Sweet Potato Fries', description: 'Crispy sweet potato fries with a hint of cinnamon, served with chipotle aioli.', price: 5.99 },
      { name: 'Onion Rings', description: 'Thick-cut onion rings battered and fried until golden and crispy.', price: 5.99 },
      { name: 'Mashed Potatoes', description: 'Creamy mashed potatoes with butter and herbs.', price: 4.99 },
      { name: 'Mac & Cheese', description: 'Creamy macaroni and cheese with a blend of cheeses and breadcrumb topping.', price: 5.99 },
      { name: 'Coleslaw', description: 'Fresh cabbage slaw with a tangy mayonnaise-based dressing.', price: 3.99 },
      { name: 'Garlic Bread', description: 'Toasted bread brushed with garlic butter and herbs.', price: 4.99 },
      { name: 'Rice Pilaf', description: 'Fluffy rice cooked with vegetables and herbs.', price: 4.99 },
      { name: 'Steamed Vegetables', description: 'Seasonal vegetables steamed to perfection with a touch of butter.', price: 5.99 },
      { name: 'Baked Beans', description: 'Slow-cooked baked beans with bacon and brown sugar.', price: 4.99 }
    ]
  }
]

async function main() {
  // Check if demo already exists
  const existing = await prisma.restaurant.findUnique({ 
    where: { slug: 'demo' },
    include: { categories: { include: { products: true } } }
  })
  if (existing) {
    console.log('Demo restaurant already exists. Deleting and recreating...')
    // Delete order items first (they reference products)
    const orders = await prisma.order.findMany({ where: { restaurantId: existing.id } })
    for (const order of orders) {
      await prisma.orderItem.deleteMany({ where: { orderId: order.id } })
    }
    // Delete orders
    await prisma.order.deleteMany({ where: { restaurantId: existing.id } })
    // Get all products first
    const products = await prisma.product.findMany({ where: { restaurantId: existing.id } })
    const productIds = products.map((p: { id: string }) => p.id)
    // Delete product relations (they reference products)
    if (productIds.length > 0) {
      await prisma.productRelation.deleteMany({ 
        where: { 
          OR: [
            { baseProductId: { in: productIds } },
            { relatedProductId: { in: productIds } }
          ]
        }
      })
    }
    // Delete product images (they reference products)
    if (productIds.length > 0) {
      await prisma.productImage.deleteMany({ 
        where: { productId: { in: productIds } }
      })
    }
    // Delete products (they reference categories)
    await prisma.product.deleteMany({ where: { restaurantId: existing.id } })
    // Delete categories
    await prisma.category.deleteMany({ where: { restaurantId: existing.id } })
    // Delete users
    await prisma.user.deleteMany({ where: { restaurantId: existing.id } })
    // Delete table sessions
    const tables = await prisma.table.findMany({ where: { restaurantId: existing.id } })
    for (const table of tables) {
      await prisma.tableSession.deleteMany({ where: { tableId: table.id } })
    }
    // Delete tables
    await prisma.table.deleteMany({ where: { restaurantId: existing.id } })
    // Finally delete restaurant
    await prisma.restaurant.delete({ where: { slug: 'demo' } })
  }

  // 1. Create Restaurant
  const adminPassword = await bcrypt.hash('password', 10)
  const restaurant = await prisma.restaurant.create({
    data: {
      name: 'Demo Restaurant',
      slug: 'demo',
      address: '123 Main Street, City, State 12345',
      users: {
        create: {
          email: 'admin@demo.com',
          passwordHash: adminPassword, 
          role: 'RESTAURANT_ADMIN'
        }
      },
      tables: {
        create: [
          { name: 'Table 1' },
          { name: 'Table 2' },
          { name: 'Table 3' },
          { name: 'Table 4' },
          { name: 'Table 5' }
        ]
      }
    }
  })

  console.log('Created restaurant:', restaurant.name)

  // 2. Create Super Admin user
  // Note: Super Admin still needs a restaurantId (schema requirement), so we use the demo restaurant as placeholder
  const superAdminPassword = await bcrypt.hash('admin123', 10)
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@demo.com',
      passwordHash: superAdminPassword,
      role: 'SUPER_ADMIN',
      restaurantId: restaurant.id // Required by schema, but not used for access control
    }
  })

  console.log('Created Super Admin user:', superAdmin.email)

  // 3. Create Categories and Products
  for (let i = 0; i < categoryData.length; i++) {
    const categoryInfo = categoryData[i]
    const category = await prisma.category.create({
      data: {
        name: categoryInfo.name,
        restaurantId: restaurant.id,
        sortOrder: i
      }
    })

    console.log(`Created category: ${category.name}`)

    // Create 10 products for each category
    for (let j = 0; j < categoryInfo.products.length; j++) {
      const productInfo = categoryInfo.products[j]
      const allergens = commonAllergens[j % commonAllergens.length]
      
      await prisma.product.create({
        data: {
          name: productInfo.name,
          description: productInfo.description,
          price: productInfo.price,
          allergens: JSON.stringify(allergens),
          restaurantId: restaurant.id,
          categoryId: category.id
        }
      })
    }

    console.log(`  Created 10 products for ${category.name}`)
  }

  console.log('\n✅ Seed completed successfully!')
  console.log(`   Restaurant: ${restaurant.name}`)
  console.log(`   Categories: ${categoryData.length}`)
  console.log(`   Products: ${categoryData.length * 10}`)
  console.log('\n📋 Login Credentials:')
  console.log(`   Super Admin: superadmin@demo.com / admin123`)
  console.log(`   Restaurant Admin: admin@demo.com / password`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
