import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import path from 'path'

// Load .env
const envPath = path.resolve(__dirname, '../.env')
dotenv.config({ path: envPath })

// Prisma 7: DATABASE_URL is read from environment automatically
const prisma = new PrismaClient()

const DEFAULT_PRODUCT_IMAGE_URL = 'https://picsum.photos/seed/picsum/300/300'

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
    "name": "Aperitive",
    "products": [
      {
        "name": "Bruschetta Trio",
        "description": "Trei varietăți de bruschette cu roșii proaspete, busuioc, mozzarella și ardei copți. Servită pe pâine artizanală prăjită, cu un fir de glazură balsamică.",
        "price": 12.99
      },
      {
        "name": "Calmar Crocant",
        "description": "Inele fragede de calmar, ușor pane și fripte până la o culoare aurie perfectă. Servite cu sos marinara și aioli de lămâie pentru înmuiat.",
        "price": 14.99
      },
      {
        "name": "Dip de Spanac și Anghinare",
        "description": "Un amestec cremos de spanac, anghinare și trei tipuri de brânzeturi, copt până devine cu bule. Servit cu chipsuri de tortilla calde și legume proaspete.",
        "price": 11.99
      },
      {
        "name": "Aripioare de Pui",
        "description": "Aripioare de pui jumbo, amestecate în sosul tău preferat: buffalo, BBQ sau usturoi-miere. Servite cu țelină și sos roquefort.",
        "price": 13.99
      },
      {
        "name": "Batoane de Mozzarella",
        "description": "Batoane de mozzarella prăjite aurii, cu un strat crocant de pesmet. Servite cu sos marinara pentru înmuiat.",
        "price": 9.99
      },
      {
        "name": "Coctel de Creveți",
        "description": "Creveți jumbo răciți, serviți cu sosul nostru signature pentru coctel și felii proaspete de lămâie. Un aperitiv clasic.",
        "price": 16.99
      },
      {
        "name": "Nachos Încărcați",
        "description": "Chipsuri crocante de tortilla acoperite cu brânză topită, jalapeño, fasole neagră, smântână, guacamole și pico de gallo.",
        "price": 12.99
      },
      {
        "name": "Ciuperci Umplute",
        "description": "Ciuperci button umplute cu brânză de cremă cu ierburi și pesmet, coapte până devin aurii și fragede.",
        "price": 10.99
      },
      {
        "name": "Inele de Ceapă",
        "description": "Inele groase de ceapă, pane și fripte până la crocanță perfectă. Servite cu sos de aioli de chipotle pentru înmuiat.",
        "price": 8.99
      },
      {
        "name": "Salată Caprese",
        "description": "Mozzarella proaspătă, roșii coapte și busuioc, stropite cu ulei de măsline extravirgin și reducție de balsamic.",
        "price": 11.99
      }
    ]
  },
  {
    "name": "Salate",
    "products": [
      {
        "name": "Salată Caesar",
        "description": "Salată de varză romenă crocantă, amestecată cu sosul nostru Caesar făcut în casă, brânză parmezan, crutoane și piper negru proaspăt măcinat.",
        "price": 10.99
      },
      {
        "name": "Salată Grecească",
        "description": "Frunze verzi mixte acoperite cu brânză feta, măsline kalamata, castraveți, roșii, ceapă roșie și vinegreta noastră grecească acidulată.",
        "price": 11.99
      },
      {
        "name": "Salată Cobb",
        "description": "Frunze verzi mixte proaspete cu pui la grătar, bacon crocant, ouă fierte tari, avocado, roșii și firimituri de brânză cu mucegai.",
        "price": 13.99
      },
      {
        "name": "Salată Asiatică cu Pui",
        "description": "Frunze verzi mixte cu pui la grătar, mandarine, wonton crocanți, migdale și sos de susan și ghimber.",
        "price": 12.99
      },
      {
        "name": "Salată Mediteraneană",
        "description": "Rucola și spanac cu legume la grătar, năut, brânză feta și o vinegretă de lămâie și ierburi.",
        "price": 11.99
      },
      {
        "name": "Salată Southwest",
        "description": "Frunze verzi mixte cu fasole neagră, porumb, roșii, avocado, fâșii de tortilla și sos chipotle ranch.",
        "price": 12.99
      },
      {
        "name": "Salată Waldorf",
        "description": "Mere crocante, țelină, struguri și nuci amestecate cu maioneză și servite pe un pat de salată verde.",
        "price": 10.99
      },
      {
        "name": "Salată de Spanac",
        "description": "Spanac baby proaspăt cu căpșuni, brânză de capră, nuci caramelizate și sos cu semințe de mac.",
        "price": 11.99
      },
      {
        "name": "Salată Chef",
        "description": "Frunze verzi mixte cu șuncă, curcan, brânză, ouă fierte tari și sosul tău preferat.",
        "price": 12.99
      },
      {
        "name": "Salată cu Rucola și Pară",
        "description": "Rucola piperată cu felii de pară, brânză gorgonzola, nuci și o vinegretă de miere și balsamic.",
        "price": 11.99
      }
    ]
  },
  {
    "name": "Burgheri",
    "products": [
      {
        "name": "Burgher Clasic",
        "description": "Chiflă de vită suculentă pe o chiflă brioche prăjită cu salată verde, roșie, ceapă, murături și sosul nostru signature. Servit cu cartofi prăjiți.",
        "price": 14.99
      },
      {
        "name": "Burgher cu Bacon și Brânză",
        "description": "Burgherul nostru clasic acoperit cu bacon crocant, brânză cheddar, salată verde, roșie și sos special.",
        "price": 16.99
      },
      {
        "name": "Burgher cu Ciuperci și Brânză Elvețiană",
        "description": "Chiflă de vită acoperită cu ciuperci călite, brânză elvețiană, ceapă caramelizată și aioli de usturoi.",
        "price": 15.99
      },
      {
        "name": "Burgher BBQ",
        "description": "Burgher la grătar cu inele de ceapă crocante, brânză cheddar, bacon și sos BBQ acidulat.",
        "price": 15.99
      },
      {
        "name": "Burgher Vegetarian",
        "description": "Chiflă vegetariană făcută în casă cu avocado, muguri, roșie și maioneză cu ierburi pe o chiflă cu cereale integrale.",
        "price": 13.99
      },
      {
        "name": "Burgher de Curcan",
        "description": "Chiflă slabă de curcan cu aioli de merișoare, rucola și brânză provolone pe o chiflă cu cereale multiple.",
        "price": 14.99
      },
      {
        "name": "Burgher de Pui",
        "description": "Piept de pui la grătar cu salată verde, roșie, ceapă roșie și maioneză de chipotle pe o chiflă brioche.",
        "price": 13.99
      },
      {
        "name": "Burgher Dublu",
        "description": "Două chifle de vită cu brânză dublă, salată verde, roșie, murături și sos special.",
        "price": 17.99
      },
      {
        "name": "Burgher Hawaii",
        "description": "Chiflă de vită cu ananas la grătar, glazură teriyaki, brânză elvețiană și ceapă crocantă.",
        "price": 15.99
      },
      {
        "name": "Burgher de Mic Dejun",
        "description": "Chiflă de vită acoperită cu un ou ochi, cartofi pai crocanți, bacon și brânză cheddar.",
        "price": 16.99
      }
    ]
  },
  {
    "name": "Pizza",
    "products": [
      {
        "name": "Margherita",
        "description": "Pizza clasică cu mozzarella proaspătă, sos de roșii, frunze de busuioc și un fir de ulei de măsline. Simplă și delicioasă.",
        "price": 12.99
      },
      {
        "name": "Pepperoni",
        "description": "Pizza tradițională cu pepperoni, brânză mozzarella și sosul nostru de roșii făcut în casă.",
        "price": 14.99
      },
      {
        "name": "Hawaiian",
        "description": "Șuncă, ananas și brânză mozzarella pe aluatul nostru signature. Un favorit tropical.",
        "price": 15.99
      },
      {
        "name": "Pentru Iubitorii de Carne",
        "description": "Încărcată cu pepperoni, cârnați italienești, bacon, șuncă și brânză mozzarella.",
        "price": 17.99
      },
      {
        "name": "Vegetariană",
        "description": "Legume proaspete, inclusiv ardei grasi, ciuperci, ceapă, măsline și roșii cu mozzarella.",
        "price": 14.99
      },
      {
        "name": "Pui BBQ",
        "description": "Pui la grătar, ceapă roșie, coriandru și sos BBQ cu brânză mozzarella.",
        "price": 16.99
      },
      {
        "name": "Patru Brânzeturi",
        "description": "Brânzeturi mozzarella, gorgonzola, parmezan și fontina pe o bază de sos alb.",
        "price": 15.99
      },
      {
        "name": "Supremă",
        "description": "Pepperoni, cârnați italienești, ardei gras, ciuperci, ceapă și măsline negre.",
        "price": 16.99
      },
      {
        "name": "Pizza Albă",
        "description": "Brânzeturi ricotta, mozzarella și parmezan cu usturoi, spanac și ulei de măsline.",
        "price": 15.99
      },
      {
        "name": "Pui Buffalo",
        "description": "Pui picant buffalo, ceapă roșie, firimituri de brânză cu mucegai și un fir de sos ranch.",
        "price": 16.99
      }
    ]
  },
  {
    "name": "Paste",
    "products": [
      {
        "name": "Spaghetti Carbonara",
        "description": "Paste italienești clasice cu pancetta crocantă, ouă, brânză parmezan și piper negru. Bogate și cremoase.",
        "price": 16.99
      },
      {
        "name": "Fettuccine Alfredo",
        "description": "Tăiței fettuccine proaspeți amestecați într-un sos cremos de parmezan cu usturoi și ierburi.",
        "price": 15.99
      },
      {
        "name": "Lasagna",
        "description": "Straturi de pastă, carne de vită tocată, ricotta, mozzarella și sos marinara, coapte la perfecție.",
        "price": 17.99
      },
      {
        "name": "Penne Arrabbiata",
        "description": "Paste penne într-un sos picant de roșii cu usturoi, ardei iuți roșii și busuioc proaspăt.",
        "price": 14.99
      },
      {
        "name": "Pui Parmesan",
        "description": "Piept de pui pane acoperit cu sos marinara și mozzarella, servit peste spaghetti.",
        "price": 18.99
      },
      {
        "name": "Scampi de Creveți",
        "description": "Paste linguine cu creveți suculenți, usturoi, vin alb, lămâie și sos cu unt.",
        "price": 19.99
      },
      {
        "name": "Bolognese",
        "description": "Sos de carne gătit lent cu carne de vită tocată, roșii și ierburi, servit peste tagliatelle.",
        "price": 17.99
      },
      {
        "name": "Paste cu Pesto",
        "description": "Pesto proaspăt de busuioc cu nuci de pin, parmezan și ulei de măsline amestecat cu tipul tău preferat de paste.",
        "price": 15.99
      },
      {
        "name": "Mac & Cheese",
        "description": "Macaroane cremoase cu un amestec de brânzeturi, acoperite cu pesmet și coapte până devin aurii.",
        "price": 13.99
      },
      {
        "name": "Linguine cu Fructe de Mare",
        "description": "Linguine cu un amestec de fructe de mare proaspete într-un sos cu vin alb și usturoi.",
        "price": 21.99
      }
    ]
  },
  {
    "name": "Fructe de Mare",
    "products": [
      {
        "name": "Somon la Grătar",
        "description": "Somon proaspăt Atlantic grătat la perfecție, servit cu legume copțe și sos cu unt și lămâie.",
        "price": 24.99
      },
      {
        "name": "Pește și Cartofi Prăjiți",
        "description": "Cod pane în aluat de bere cu cartofi prăjiți crocanți, salată de varză și sos tartar. Un clasic britanic.",
        "price": 16.99
      },
      {
        "name": "Lobster Roll",
        "description": "Carne proaspătă de homar amestecată cu maioneză și ierburi, servită într-un chifle cu unt și cartofi prăjiți.",
        "price": 28.99
      },
      {
        "name": "Scampi de Creveți",
        "description": "Creveți mari căliți în usturoi, vin alb și unt, serviți peste paste sau orez.",
        "price": 22.99
      },
      {
        "name": "Prăjiturele de Crab",
        "description": "Prăjiturele de crab jumbo cu bucăți mari, sezate în tigaie până devin aurii, servite cu sos remoulade și lămâie.",
        "price": 23.99
      },
      {
        "name": "Friptură de Ton",
        "description": "Friptură de ton searată cu un crust de susan, servită cu aioli de wasabi și ghimber murat.",
        "price": 25.99
      },
      {
        "name": "Taco cu Pește",
        "description": "Pește alb la grătar în tortilla moale cu salată de varză, avocado și smântână de chipotle.",
        "price": 15.99
      },
      {
        "name": "Paella cu Fructe de Mare",
        "description": "Preparat tradițional spaniol de orez cu creveți, midii, scoici și chorizo.",
        "price": 26.99
      },
      {
        "name": "Linguine alle Vongole",
        "description": "Paste linguine cu scoici proaspete într-un sos cu vin alb și usturoi.",
        "price": 20.99
      },
      {
        "name": "Creveți cu Nucă de Cocoș",
        "description": "Creveți crocanți pane cu nucă de cocos, serviți cu sos picant dulce de chili pentru înmuiat.",
        "price": 18.99
      }
    ]
  },
  {
    "name": "Fripturi",
    "products": [
      {
        "name": "Friptură Ribeye",
        "description": "Friptură prime ribeye grătate la preferința ta, servită cu piure de cartofi cu usturoi și legume de sezon.",
        "price": 32.99
      },
      {
        "name": "Filet Mignon",
        "description": "File mignon fraged, gătit la perfecție, servit cu cartofi copți și sos béarnaise.",
        "price": 34.99
      },
      {
        "name": "New York Strip",
        "description": "Friptură strip bine marmorată, grătită și servită cu cartof copt încărcat și sparanghel.",
        "price": 30.99
      },
      {
        "name": "Friptură T-Bone",
        "description": "Friptură mare T-bone care combină aromele strip-ului și fileului, servită cu cartofi prăjiți.",
        "price": 35.99
      },
      {
        "name": "Porterhouse",
        "description": "Friptură masivă porterhouse pentru doi, grătită și servită cu două garnituri la alegere.",
        "price": 68.99
      },
      {
        "name": "Friptură Sirloin",
        "description": "Friptură suculentă de sirloin cu sos piper verde, servită cu piure de cartofi și fasole verde.",
        "price": 26.99
      },
      {
        "name": "Steak Frites",
        "description": "Friptură fragedă servită cu cartofi prăjiți crocanți francesi și aioli de usturoi.",
        "price": 28.99
      },
      {
        "name": "Surf & Turf",
        "description": "File mignon însoțit de o coadă de homar, servit cu unt topit și două garnituri.",
        "price": 42.99
      },
      {
        "name": "Sandviș cu Ribeye",
        "description": "Friptură de ribeye feliată pe o chiflă prăjită cu ceapă caramelizată și aioli de hrean.",
        "price": 18.99
      },
      {
        "name": "Salată cu Friptură",
        "description": "Fâșii de sirloin la grătar peste frunze verzi mixte cu brânză cu mucegai, roșii și vinegretă de vin roșu.",
        "price": 22.99
      }
    ]
  },
  {
    "name": "Deserturi",
    "products": [
      {
        "name": "Prăjitură Cu Lava de Ciocolată",
        "description": "Prăjitură caldă de ciocolată cu un centru topit, servită cu înghețată de vanilie și fructe de pădure proaspete.",
        "price": 9.99
      },
      {
        "name": "Cheesecake New York",
        "description": "Cheesecake clasic cremos cu un blat de pesmet graham, acoperit cu compot de fructe de pădure la alegere.",
        "price": 8.99
      },
      {
        "name": "Tiramisu",
        "description": "Desert italian tradițional cu straturi de pișcoturi înmuiate în cafea și cremă de mascarpone.",
        "price": 9.99
      },
      {
        "name": "Plăcintă cu Mere",
        "description": "Plăcintă cu mere făcută în casă, cu o crustă foietaj, servită caldă cu înghețată de vanilie și un fir de caramel.",
        "price": 7.99
      },
      {
        "name": "Sundae Brownie",
        "description": "Brownie cald de ciocolată acoperit cu înghețată de vanilie, sos de ciocolată cald, frișcă și o cireașă.",
        "price": 8.99
      },
      {
        "name": "Crème Brûlée",
        "description": "Crema clasică franceză cu o crustă de zahăr caramelizat, servită cu fructe de pădure proaspete.",
        "price": 9.99
      },
      {
        "name": "Plăcintă Key Lime",
        "description": "Plăcintă acidulată Key Lime cu un blat de pesmet graham și topping de frișcă.",
        "price": 7.99
      },
      {
        "name": "Mostră de Înghețată",
        "description": "Trei bulgări de înghețată făcută în casă, cu aromele și toppingurile tale preferate.",
        "price": 8.99
      },
      {
        "name": "Fursecuri cu Fulgi de Ciocolată",
        "description": "Fursecuri calde și vâscoase cu fulgi de ciocolată, servite cu un pahar de lapte rece.",
        "price": 6.99
      },
      {
        "name": "Pudding de Pâine",
        "description": "Pudding cald de pâine cu sos de vanilie și un strop de scorțișoară.",
        "price": 7.99
      }
    ]
  },
  {
    "name": "Băuturi",
    "products": [
      {
        "name": "Limonadă Proaspătă",
        "description": "Limonadă făcută în casă cu lămâi proaspăt stoarse, servită pe gheață cu o felie de lămâie.",
        "price": 4.99
      },
      {
        "name": "Ceai Rece",
        "description": "Ceai negru proaspăt preparat, îndulcit sau neîndulcit, servit cu lămâie.",
        "price": 3.99
      },
      {
        "name": "Suc de Portocale Proaspăt",
        "description": "Suc de portocale proaspăt stors, servit răcorit.",
        "price": 5.99
      },
      {
        "name": "Suc",
        "description": "Băuturi răcoritoare variate, inclusiv cola, limonadă și root beer.",
        "price": 2.99
      },
      {
        "name": "Apă Minerală",
        "description": "Apă minerală răcoritoare cu o felie de lămâie sau lime.",
        "price": 3.99
      },
      {
        "name": "Cafea",
        "description": "Cafea proaspăt preparată, servită fierbinte cu smântână și zahăr separat.",
        "price": 3.49
      },
      {
        "name": "Cappuccino",
        "description": "Espresso cu lapte aburit și un strat de spumă, presărat cu cacao.",
        "price": 4.99
      },
      {
        "name": "Latte",
        "description": "Espresso cu lapte aburit, disponibil în diverse arome precum vanilie, caramel sau alune.",
        "price": 5.49
      },
      {
        "name": "Milkshake",
        "description": "Milkshake gros și cremos disponibil în arome de ciocolată, vanilie sau căpșuni.",
        "price": 6.99
      },
      {
        "name": "Smoothie",
        "description": "Smoothie de fructe mixate cu alegerea ta între căpșuni, banane sau fructe de pădure mixte.",
        "price": 6.99
      }
    ]
  },
  {
    "name": "Garnituri",
    "products": [
      {
        "name": "Cartofi Prăjiți",
        "description": "Cartofi prăjiți crocanți aurii, condimentați cu sare de mare, serviți cu ketchup.",
        "price": 4.99
      },
      {
        "name": "Cartofi Dulci Prăjiți",
        "description": "Cartofi dulci prăjiți crocanți cu un indiciu de scorțișoară, serviți cu aioli de chipotle.",
        "price": 5.99
      },
      {
        "name": "Inele de Ceapă",
        "description": "Inele groase de ceapă, pane și fripte până devin aurii și crocante.",
        "price": 5.99
      },
      {
        "name": "Piure de Cartofi",
        "description": "Piure cremos de cartofi cu unt și ierburi.",
        "price": 4.99
      },
      {
        "name": "Mac & Cheese",
        "description": "Macaroane și brânză cremoasă cu un amestec de brânzeturi și topping de pesmet.",
        "price": 5.99
      },
      {
        "name": "Salată de Varză",
        "description": "Salată proaspătă de varză cu un dressing tangos pe bază de maioneză.",
        "price": 3.99
      },
      {
        "name": "Pâine cu Usturoi",
        "description": "Pâine prăjită unsă cu unt de usturoi și ierburi.",
        "price": 4.99
      },
      {
        "name": "Pilaf de Orez",
        "description": "Orez pufos gătit cu legume și ierburi.",
        "price": 4.99
      },
      {
        "name": "Legume Fierte",
        "description": "Legume de sezon fierte la perfecție cu un strop de unt.",
        "price": 5.99
      },
      {
        "name": "Fasole la Cuptor",
        "description": "Fasole gătită încet la cuptor cu bacon și zahăr brun.",
        "price": 4.99
      }
    ]
  }
]

async function main() {
  // Check if demo already exists
  const existing = await prisma.restaurant.findUnique({ 
    where: { slug: 'belvedere' },
    include: { categories: { include: { products: true } } }
  })
  if (existing) {
    console.log('Restaurant Belvedere already exists. Deleting and recreating...')
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
    // Delete table categories
    await prisma.tableCategory.deleteMany({ where: { restaurantId: existing.id } })
    // Finally delete restaurant
    await prisma.restaurant.delete({ where: { slug: 'belvedere' } })
  }

  // 1. Create Restaurant with users (no tables yet - we'll add them after categories)
  const restaurant = await prisma.restaurant.create({
    data: {
      name: 'Restaurant Belvedere',
      slug: 'belvedere',
      address: 'Strada Belvedere, Cluj-Napoca, Romania',
      logoUrl: 'https://placehold.co/400',
      phoneNumber: '+40740123456',
      contactPerson: 'Mihai Popescu',
      contractStart: new Date(),
      contractEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      users: {
        create: [
          {
            email: 'admin@gmail.com',
            passwordHash: await bcrypt.hash('password', 10), 
            role: 'RESTAURANT_ADMIN'
          },
          {
            email: 'kitchen@gmail.com',
            passwordHash: await bcrypt.hash('password', 10), 
            role: 'KITCHEN'
          },
          {
            email: 'waiter@gmail.com',
            passwordHash: await bcrypt.hash('password', 10), 
            role: 'SERVER'
          },
          {
            email: 'waiter2@gmail.com',
            passwordHash: await bcrypt.hash('password', 10), 
            role: 'SERVER'
          }
        ]
      }
    }
  })

  console.log('Created restaurant:', restaurant.name)

  // 2. Create Table Categories
  const indoorsCategory = await prisma.tableCategory.create({
    data: {
      name: 'Indoors',
      description: 'Indoor seating area',
      sortOrder: 0,
      restaurantId: restaurant.id
    }
  })

  const terraceCategory = await prisma.tableCategory.create({
    data: {
      name: 'Terrace',
      description: 'Outdoor terrace seating',
      sortOrder: 1,
      restaurantId: restaurant.id
    }
  })

  const barCategory = await prisma.tableCategory.create({
    data: {
      name: 'Bar',
      description: 'Bar counter seating',
      sortOrder: 2,
      restaurantId: restaurant.id
    }
  })

  console.log('Created table categories: Indoors, Terrace, Bar')

  // 3. Create Tables assigned to categories
  const tablesData = [
    // Indoors tables
    { name: 'Table 1', categoryId: indoorsCategory.id, chairs: 4 },
    { name: 'Table 2', categoryId: indoorsCategory.id, chairs: 4 },
    { name: 'Table 3', categoryId: indoorsCategory.id, chairs: 6 },
    { name: 'Table 4', categoryId: indoorsCategory.id, chairs: 2 },
    // Terrace tables
    { name: 'Table 5', categoryId: terraceCategory.id, chairs: 4 },
    { name: 'Table 6', categoryId: terraceCategory.id, chairs: 4 },
    { name: 'Table 7', categoryId: terraceCategory.id, chairs: 6 },
    // Bar tables
    { name: 'Bar 1', categoryId: barCategory.id, chairs: 2 },
    { name: 'Bar 2', categoryId: barCategory.id, chairs: 2 },
    { name: 'Bar 3', categoryId: barCategory.id, chairs: 2 }
  ]

  for (const tableData of tablesData) {
    await prisma.table.create({
      data: {
        name: tableData.name,
        chairs: tableData.chairs,
        categoryId: tableData.categoryId,
        restaurantId: restaurant.id
      }
    })
  }

  console.log(`Created ${tablesData.length} tables across categories`)

  // 4. Create Super Admin user
  // Note: Super Admin still needs a restaurantId (schema requirement), so we use the demo restaurant as placeholder
  const superAdmin = await prisma.user.create({
    data: {
      email: 'super@gmail.com',
      passwordHash: await bcrypt.hash('PParolamea00', 10),
      role: 'SUPER_ADMIN',
      restaurantId: restaurant.id
    }
  })

  console.log('Created Super Admin user:', superAdmin.email)

  // 5. Create Categories and Products
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
          categoryId: category.id,
          images: {
            create: [{ url: DEFAULT_PRODUCT_IMAGE_URL, type: 'image' }]
          }
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
  console.log(`   Super Admin: super@gmail.com / PParolamea00`)
  console.log(`   Restaurant Admin: admin@gmail.com / password`)
  console.log(`   Kitchen: kitchen@gmail.com / password`)
  console.log(`   Waiter: waiter@gmail.com / password`)
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
