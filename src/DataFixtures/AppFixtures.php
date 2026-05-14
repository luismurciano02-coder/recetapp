<?php

namespace App\DataFixtures;

use App\Entity\Categoria;
use App\Entity\Ingrediente;
use App\Entity\Paso;
use App\Entity\Receta;
use App\Entity\Usuario;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\String\Slugger\AsciiSlugger;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Fixtures de RecetApp.
 *
 *   - Usuario "RecetaApp" → recetaapp@recetapp.com / test1234
 *   - 8 categorías base
 *   - 50 recetas distribuidas en las 8 categorías:
 *       Desayunos:6 · Postres:7 · Pasta:7 · Carnes:7 · Ensaladas:6
 *       Sopas:6 · Arroces:6 · Vegetariano:5
 *
 * Carga: php bin/console doctrine:fixtures:load --no-interaction
 */
class AppFixtures extends Fixture
{
    public function __construct(
        private readonly UserPasswordHasherInterface $hasher
    ) {
    }

    public function load(ObjectManager $manager): void
    {
        $slugger = new AsciiSlugger();

        // ─── Usuario RecetaApp ────────────────────────────────────────────
        $autor = new Usuario();
        $autor->setGmail('recetaapp@recetapp.com');
        $autor->setRoles(['ROLE_USER']);
        $autor->setCreatedAt(new \DateTime());
        $autor->setPassword($this->hasher->hashPassword($autor, 'test1234'));
        $manager->persist($autor);

        // ─── Categorías ───────────────────────────────────────────────────
        $categoriasData = [
            ['Desayunos',    'bi-cup-hot'],
            ['Postres',      'bi-cake2'],
            ['Pasta',        'bi-egg-fried'],
            ['Carnes',       'bi-fire'],
            ['Ensaladas',    'bi-flower1'],
            ['Sopas',        'bi-droplet'],
            ['Arroces',      'bi-grid-3x3-gap'],
            ['Vegetariano',  'bi-tree'],
        ];

        $categorias = [];
        foreach ($categoriasData as [$tipo, $icono]) {
            $cat = new Categoria();
            $cat->setTipo($tipo);
            $cat->setSlug(strtolower((string) $slugger->slug($tipo)));
            $cat->setIcono($icono);
            $manager->persist($cat);
            $categorias[$tipo] = $cat;
        }

        // Helper para construir URLs de Unsplash con tamaño y formato uniformes.
        $img = static fn(string $id): string =>
            "https://images.unsplash.com/photo-{$id}?w=900&auto=format&fit=crop";

        // ─── 50 recetas ──────────────────────────────────────────────────
        // Formato: [nombre, descripcion, tiempo, raciones, imagen, categoria,
        //           ingredientes[[name, cantidad, unidad], ...],
        //           pasos[descripciones]]
        $recetas = [
            // ━━━━━━━━━━━━━━━━━━━━ DESAYUNOS (6) ━━━━━━━━━━━━━━━━━━━━
            [
                'Tortitas americanas con sirope',
                'Tortitas esponjosas y doradas, perfectas para un domingo en familia.',
                25, 4, $img('1528207776546-365bb710ee93'), 'Desayunos',
                [['Harina', 250, 'g'], ['Leche', 300, 'ml'], ['Huevos', 2, 'ud'], ['Azúcar', 30, 'g'], ['Levadura', 10, 'g'], ['Mantequilla', 40, 'g']],
                [
                    'Mezcla los ingredientes secos en un bol grande.',
                    'Bate los huevos con la leche y la mantequilla derretida e incorpóralos a la mezcla seca.',
                    'Calienta una sartén antiadherente y vierte un cucharón de masa por tortita.',
                    'Cuando aparezcan burbujas dale la vuelta y cocina 1 minuto más. Sirve con sirope.',
                ],
            ],
            [
                'Tostadas francesas con canela',
                'Pan empapado en huevo y leche, dorado en sartén con un toque de canela.',
                15, 2, $img('1484723091739-30a097e8f929'), 'Desayunos',
                [['Pan brioche', 4, 'rebanadas'], ['Huevos', 2, 'ud'], ['Leche', 100, 'ml'], ['Canela', 1, 'cdta'], ['Azúcar', 20, 'g'], ['Mantequilla', 20, 'g']],
                [
                    'Bate los huevos con la leche, la canela y el azúcar.',
                    'Empapa cada rebanada de pan en la mezcla.',
                    'Funde mantequilla en una sartén y dora el pan por ambos lados.',
                    'Sirve caliente con sirope de arce o frutas frescas.',
                ],
            ],
            [
                'Avocado toast con huevo poché',
                'Tostada crujiente con aguacate aplastado y huevo poché por encima.',
                15, 2, $img('1541519227354-08fa5d50c44d'), 'Desayunos',
                [['Pan integral', 2, 'rebanadas'], ['Aguacate', 1, 'ud'], ['Huevos', 2, 'ud'], ['Limón', 0.5, 'ud'], ['Sal', 1, 'pizca'], ['Pimienta', 1, 'pizca']],
                [
                    'Tuesta el pan integral hasta que esté crujiente.',
                    'Aplasta el aguacate con zumo de limón, sal y pimienta.',
                    'Escalfa los huevos en agua hirviendo con un chorrito de vinagre durante 3 minutos.',
                    'Unta el aguacate sobre el pan y corona con el huevo poché.',
                ],
            ],
            [
                'Smoothie bowl tropical',
                'Bowl espeso de plátano y mango con granola, coco y frutos rojos.',
                10, 2, $img('1627308594190-a057cd4bfac8'), 'Desayunos',
                [['Plátano congelado', 2, 'ud'], ['Mango congelado', 200, 'g'], ['Yogur griego', 150, 'g'], ['Granola', 60, 'g'], ['Coco rallado', 20, 'g'], ['Frutos rojos', 80, 'g']],
                [
                    'Tritura el plátano, el mango y el yogur hasta obtener una crema espesa.',
                    'Vierte la mezcla en un bol.',
                    'Decora con granola, coco rallado y frutos rojos.',
                    'Sirve inmediatamente para que conserve la textura.',
                ],
            ],
            [
                'Granola casera con yogur',
                'Granola crujiente al horno servida con yogur natural y miel.',
                40, 6, $img('1621470626764-0e8c9303800a'), 'Desayunos',
                [['Avena', 300, 'g'], ['Frutos secos', 100, 'g'], ['Miel', 80, 'g'], ['Aceite de coco', 40, 'g'], ['Yogur natural', 500, 'g'], ['Frutas frescas', 200, 'g']],
                [
                    'Mezcla la avena con los frutos secos, la miel y el aceite de coco.',
                    'Extiende sobre una bandeja y hornea a 160°C durante 25 minutos removiendo a mitad.',
                    'Deja enfriar para que quede crujiente.',
                    'Sirve con yogur natural y trozos de fruta fresca.',
                ],
            ],
            [
                'Huevos benedictinos',
                'Muffin inglés con bacon, huevo poché y salsa holandesa cremosa.',
                30, 2, $img('1608039829572-78524f79c4c7'), 'Desayunos',
                [['Muffins ingleses', 2, 'ud'], ['Bacon', 4, 'lonchas'], ['Huevos', 4, 'ud'], ['Mantequilla', 100, 'g'], ['Yemas', 2, 'ud'], ['Limón', 0.5, 'ud']],
                [
                    'Tuesta los muffins y dora el bacon en una sartén.',
                    'Escalfa los huevos en agua hirviendo con vinagre durante 3 minutos.',
                    'Prepara la holandesa batiendo las yemas con limón al baño maría e incorporando la mantequilla derretida.',
                    'Monta el plato: muffin, bacon, huevo y salsa por encima.',
                ],
            ],

            // ━━━━━━━━━━━━━━━━━━━━ POSTRES (7) ━━━━━━━━━━━━━━━━━━━━
            [
                'Tarta de queso al horno',
                'Tarta cremosa y densa con base de galleta crujiente.',
                75, 8, $img('1567171466295-4afa63d45416'), 'Postres',
                [['Queso crema', 600, 'g'], ['Galletas digestive', 200, 'g'], ['Mantequilla', 80, 'g'], ['Azúcar', 150, 'g'], ['Huevos', 3, 'ud'], ['Nata', 200, 'ml']],
                [
                    'Tritura las galletas y mézclalas con mantequilla derretida; forra el molde.',
                    'Bate el queso con el azúcar, los huevos y la nata.',
                    'Vierte sobre la base y hornea a 160°C durante 50 minutos.',
                    'Apaga el horno y deja dentro 10 min más. Refrigera 4 horas antes de servir.',
                ],
            ],
            [
                'Brownie de chocolate intenso',
                'Brownie denso, fundente y con corazón húmedo de chocolate negro.',
                40, 9, $img('1606313564200-e75d5e30476c'), 'Postres',
                [['Chocolate negro', 200, 'g'], ['Mantequilla', 150, 'g'], ['Huevos', 3, 'ud'], ['Azúcar', 200, 'g'], ['Harina', 80, 'g'], ['Nueces', 80, 'g']],
                [
                    'Funde el chocolate con la mantequilla al baño maría.',
                    'Bate los huevos con el azúcar hasta blanquear y añade el chocolate.',
                    'Incorpora la harina tamizada y las nueces troceadas.',
                    'Hornea a 180°C durante 25 minutos. El centro debe quedar húmedo.',
                ],
            ],
            [
                'Tiramisú clásico italiano',
                'Capas de bizcochos empapados en café con crema de mascarpone.',
                30, 6, $img('1571877227200-a0d98ea607e9'), 'Postres',
                [['Mascarpone', 500, 'g'], ['Huevos', 4, 'ud'], ['Azúcar', 100, 'g'], ['Bizcochos savoiardi', 200, 'g'], ['Café fuerte', 300, 'ml'], ['Cacao en polvo', 30, 'g']],
                [
                    'Separa las claras de las yemas. Bate las yemas con el azúcar hasta blanquear.',
                    'Incorpora el mascarpone y luego las claras montadas con movimientos envolventes.',
                    'Empapa los bizcochos en café y monta capas alternando con la crema.',
                    'Espolvorea cacao y refrigera al menos 4 horas.',
                ],
            ],
            [
                'Flan de huevo casero',
                'Flan tradicional de huevo y leche con caramelo dorado.',
                60, 6, $img('1653988354010-39637252a2db'), 'Postres',
                [['Huevos', 4, 'ud'], ['Leche', 500, 'ml'], ['Azúcar', 150, 'g'], ['Vainilla', 1, 'vaina'], ['Limón', 1, 'piel'], ['Azúcar caramelo', 80, 'g']],
                [
                    'Haz el caramelo derritiendo los 80g de azúcar y vierte en el molde.',
                    'Calienta la leche con la vainilla y la piel de limón.',
                    'Bate los huevos con el azúcar e incorpora la leche colada.',
                    'Hornea al baño maría a 160°C durante 45 minutos. Refrigera antes de desmoldar.',
                ],
            ],
            [
                'Crepes con Nutella y plátano',
                'Crepes finas francesas rellenas de crema de cacao y plátano laminado.',
                20, 4, $img('1491857224789-38449de629ce'), 'Postres',
                [['Harina', 150, 'g'], ['Leche', 300, 'ml'], ['Huevos', 2, 'ud'], ['Mantequilla', 30, 'g'], ['Nutella', 200, 'g'], ['Plátanos', 2, 'ud']],
                [
                    'Bate la harina, la leche, los huevos y la mantequilla derretida hasta obtener una masa lisa.',
                    'Calienta una sartén y vierte un cazo de masa, extendiéndola fina.',
                    'Cocina 1 minuto por lado y reserva.',
                    'Unta cada crepe con Nutella, añade plátano laminado y enrolla.',
                ],
            ],
            [
                'Galletas de chocolate chip',
                'Galletas crujientes por fuera y blandas por dentro con pepitas de chocolate.',
                30, 12, $img('1499636136210-6f4ee915583e'), 'Postres',
                [['Mantequilla', 150, 'g'], ['Azúcar moreno', 150, 'g'], ['Huevo', 1, 'ud'], ['Harina', 250, 'g'], ['Levadura', 5, 'g'], ['Pepitas de chocolate', 200, 'g']],
                [
                    'Bate la mantequilla con el azúcar moreno hasta cremar.',
                    'Añade el huevo, luego la harina con la levadura y por último las pepitas.',
                    'Forma bolitas y disponlas separadas en una bandeja.',
                    'Hornea a 180°C durante 12 minutos. Deja enfriar antes de mover.',
                ],
            ],
            [
                'Mousse de chocolate negro',
                'Mousse esponjoso y aireado con un final intenso a chocolate puro.',
                240, 4, $img('1590080875852-ba44f83ff2db'), 'Postres',
                [['Chocolate negro 70%', 200, 'g'], ['Nata para montar', 300, 'ml'], ['Huevos', 3, 'ud'], ['Azúcar', 50, 'g'], ['Mantequilla', 30, 'g'], ['Sal', 1, 'pizca']],
                [
                    'Funde el chocolate con la mantequilla al baño maría.',
                    'Separa las claras de las yemas e incorpora las yemas al chocolate templado.',
                    'Monta las claras con el azúcar y la sal a punto de nieve.',
                    'Mezcla con cuidado claras + nata semi-montada al chocolate. Refrigera 4 horas.',
                ],
            ],

            // ━━━━━━━━━━━━━━━━━━━━ PASTA (7) ━━━━━━━━━━━━━━━━━━━━
            [
                'Espaguetis a la carbonara auténticos',
                'La receta italiana original: solo huevo, queso, panceta y pimienta.',
                20, 4, $img('1612874742237-6526221588e3'), 'Pasta',
                [['Espaguetis', 400, 'g'], ['Guanciale', 150, 'g'], ['Yemas', 4, 'ud'], ['Pecorino', 80, 'g'], ['Pimienta negra', 1, 'cdta'], ['Sal gruesa', 1, 'pizca']],
                [
                    'Cuece los espaguetis al dente. Reserva agua de cocción.',
                    'Dora el guanciale en una sartén sin aceite hasta que suelte su grasa.',
                    'Bate las yemas con el pecorino y abundante pimienta.',
                    'Mezcla pasta + guanciale fuera del fuego e incorpora las yemas removiendo rápido.',
                ],
            ],
            [
                'Lasaña boloñesa',
                'Capas de pasta, salsa boloñesa y bechamel gratinadas al horno.',
                90, 6, $img('1709429790175-b02bb1b19207'), 'Pasta',
                [['Placas de lasaña', 12, 'ud'], ['Carne picada', 500, 'g'], ['Tomate triturado', 800, 'g'], ['Bechamel', 600, 'ml'], ['Queso rallado', 200, 'g'], ['Cebolla', 1, 'ud']],
                [
                    'Sofríe la cebolla picada y añade la carne hasta dorar.',
                    'Incorpora el tomate y cocina 30 minutos para hacer la boloñesa.',
                    'Monta capas en una fuente: pasta, boloñesa, bechamel. Repite hasta terminar.',
                    'Cubre con queso y hornea a 200°C durante 30 minutos.',
                ],
            ],
            [
                'Pasta al pesto genovés',
                'Pasta corta con salsa de albahaca, piñones, ajo y parmesano.',
                15, 4, $img('1567608285969-48e4bbe0d399'), 'Pasta',
                [['Trofie o fusilli', 400, 'g'], ['Albahaca fresca', 60, 'g'], ['Piñones', 30, 'g'], ['Ajo', 1, 'diente'], ['Parmesano', 60, 'g'], ['Aceite de oliva', 100, 'ml']],
                [
                    'Tritura albahaca, piñones, ajo y parmesano con aceite hasta una salsa lisa.',
                    'Cuece la pasta al dente y reserva agua de cocción.',
                    'Mezcla la pasta con el pesto fuera del fuego, añadiendo agua si hace falta.',
                    'Sirve con más parmesano y unas hojas de albahaca encima.',
                ],
            ],
            [
                'Macarrones con queso al horno',
                'Pasta cremosa cubierta de queso fundido y costra crujiente.',
                40, 4, $img('1667499989723-c4ab9549d63c'), 'Pasta',
                [['Macarrones', 400, 'g'], ['Mantequilla', 50, 'g'], ['Harina', 40, 'g'], ['Leche', 600, 'ml'], ['Cheddar rallado', 250, 'g'], ['Pan rallado', 50, 'g']],
                [
                    'Cuece los macarrones 2 minutos menos que el tiempo del paquete.',
                    'Funde la mantequilla, añade la harina y luego la leche para hacer una bechamel.',
                    'Incorpora el cheddar a la bechamel y mezcla con la pasta.',
                    'Pasa a una fuente, cubre con pan rallado y queso, gratina 15 minutos a 200°C.',
                ],
            ],
            [
                'Espaguetis a la puttanesca',
                'Pasta con tomate, anchoas, alcaparras y aceitunas negras.',
                20, 4, $img('1551183053-bf91a1d81141'), 'Pasta',
                [['Espaguetis', 400, 'g'], ['Tomate triturado', 400, 'g'], ['Anchoas', 6, 'filetes'], ['Alcaparras', 30, 'g'], ['Aceitunas negras', 60, 'g'], ['Ajo', 2, 'dientes']],
                [
                    'Sofríe el ajo en aceite y añade las anchoas hasta deshacerlas.',
                    'Incorpora el tomate, las alcaparras y las aceitunas. Cocina 10 minutos.',
                    'Cuece los espaguetis al dente.',
                    'Mezcla la pasta con la salsa y un chorro de aceite crudo. Sirve enseguida.',
                ],
            ],
            [
                'Penne arrabbiata',
                'Pasta con tomate, ajo y guindilla — picante y reconfortante.',
                20, 4, $img('1676300184847-4ee4030409c0'), 'Pasta',
                [['Penne', 400, 'g'], ['Tomate triturado', 500, 'g'], ['Ajo', 3, 'dientes'], ['Guindilla', 1, 'ud'], ['Aceite de oliva', 50, 'ml'], ['Perejil', 1, 'puñado']],
                [
                    'Pocha el ajo laminado con la guindilla en aceite a fuego suave.',
                    'Añade el tomate y deja reducir 12 minutos.',
                    'Cuece la pasta al dente.',
                    'Mezcla la pasta con la salsa, espolvorea perejil y sirve.',
                ],
            ],
            [
                'Fettuccine Alfredo',
                'Pasta con salsa cremosa de mantequilla y parmesano.',
                15, 2, $img('1645112411341-6c4fd023714a'), 'Pasta',
                [['Fettuccine', 250, 'g'], ['Mantequilla', 80, 'g'], ['Nata', 200, 'ml'], ['Parmesano', 100, 'g'], ['Pimienta negra', 1, 'cdta'], ['Sal', 1, 'pizca']],
                [
                    'Cuece la pasta al dente.',
                    'Funde la mantequilla en una sartén grande y añade la nata.',
                    'Incorpora el parmesano rallado removiendo hasta que se funda.',
                    'Mezcla la pasta con la salsa y termina con pimienta recién molida.',
                ],
            ],

            // ━━━━━━━━━━━━━━━━━━━━ CARNES (7) ━━━━━━━━━━━━━━━━━━━━
            [
                'Solomillo de cerdo a la mostaza',
                'Solomillo jugoso glaseado con mostaza, miel y romero.',
                40, 4, $img('1544025162-d76694265947'), 'Carnes',
                [['Solomillo de cerdo', 600, 'g'], ['Mostaza Dijon', 3, 'cda'], ['Miel', 2, 'cda'], ['Romero', 2, 'ramas'], ['Aceite', 30, 'ml'], ['Sal y pimienta', 1, 'pizca']],
                [
                    'Salpimenta el solomillo y dóralo en sartén por todos los lados.',
                    'Mezcla mostaza con miel y unta el solomillo. Añade romero.',
                    'Hornea a 180°C durante 20 minutos regando con sus jugos.',
                    'Deja reposar 5 minutos antes de cortar en medallones.',
                ],
            ],
            [
                'Pollo al horno con limón y patatas',
                'Pollo dorado con patatas asadas, limón y hierbas.',
                70, 4, $img('1604908554027-7ee9bcde9389'), 'Carnes',
                [['Pollo entero', 1.5, 'kg'], ['Patatas', 1, 'kg'], ['Limón', 1, 'ud'], ['Romero', 2, 'ramas'], ['Ajo', 4, 'dientes'], ['Aceite de oliva', 60, 'ml']],
                [
                    'Pela y trocea las patatas, disponlas en una bandeja con aceite y sal.',
                    'Coloca el pollo encima, salpimentado y con el limón cortado en cuartos por dentro.',
                    'Reparte ajo, romero y un buen chorro de aceite por encima.',
                    'Hornea a 200°C durante 1 hora regando con los jugos a media cocción.',
                ],
            ],
            [
                'Hamburguesa casera con queso',
                'Hamburguesa de ternera jugosa con cheddar fundido y bacon.',
                25, 2, $img('1568901346375-23c9450c58cd'), 'Carnes',
                [['Carne picada de ternera', 400, 'g'], ['Pan brioche', 2, 'ud'], ['Cheddar', 2, 'lonchas'], ['Bacon', 4, 'lonchas'], ['Lechuga', 4, 'hojas'], ['Tomate', 1, 'ud']],
                [
                    'Forma dos hamburguesas con la carne, salpimenta y deja reposar.',
                    'Dora el bacon hasta crujiente y reserva.',
                    'Cocina las hamburguesas a fuego fuerte 3 minutos por lado y funde el queso encima.',
                    'Tuesta el pan, monta con lechuga, tomate, hamburguesa y bacon.',
                ],
            ],
            [
                'Costillas a la barbacoa',
                'Costillas de cerdo glaseadas con salsa BBQ y horneadas a baja temperatura.',
                180, 4, $img('1529193591184-b1d58069ecdd'), 'Carnes',
                [['Costillas de cerdo', 1.5, 'kg'], ['Salsa BBQ', 200, 'ml'], ['Pimentón', 1, 'cda'], ['Azúcar moreno', 2, 'cda'], ['Ajo en polvo', 1, 'cdta'], ['Sal', 1, 'cdta']],
                [
                    'Mezcla pimentón, azúcar, ajo y sal y úntalo sobre las costillas.',
                    'Envuelve en papel aluminio y hornea a 150°C durante 2 horas.',
                    'Retira el aluminio y pinta con salsa BBQ.',
                    'Hornea 30 minutos más a 200°C glaseando cada 10 minutos.',
                ],
            ],
            [
                'Albóndigas en salsa de tomate',
                'Albóndigas tiernas guisadas en salsa casera de tomate.',
                50, 4, $img('1565086869529-8c7802cca7a0'), 'Carnes',
                [['Carne picada mixta', 500, 'g'], ['Pan rallado', 50, 'g'], ['Huevo', 1, 'ud'], ['Tomate triturado', 500, 'g'], ['Cebolla', 1, 'ud'], ['Ajo', 2, 'dientes']],
                [
                    'Mezcla carne, pan rallado y huevo, salpimenta y forma bolitas.',
                    'Dóralas en una cazuela con aceite y reserva.',
                    'En la misma cazuela sofríe cebolla y ajo, añade el tomate.',
                    'Devuelve las albóndigas, cuece 25 minutos a fuego suave.',
                ],
            ],
            [
                'Filete de ternera con salsa de setas',
                'Filete a la plancha cubierto de salsa cremosa de setas.',
                25, 2, $img('1712746784937-aa56235fbab0'), 'Carnes',
                [['Filete de ternera', 400, 'g'], ['Setas variadas', 250, 'g'], ['Nata', 150, 'ml'], ['Brandy', 30, 'ml'], ['Mantequilla', 30, 'g'], ['Perejil', 1, 'puñado']],
                [
                    'Marca el filete a fuego fuerte 2 minutos por lado y reserva tapado.',
                    'En la misma sartén funde mantequilla y saltea las setas.',
                    'Flambea con brandy y añade la nata. Reduce 3 minutos.',
                    'Sirve el filete con la salsa de setas por encima y perejil.',
                ],
            ],
            [
                'Pollo al curry con arroz',
                'Pollo guisado en salsa cremosa de curry con leche de coco.',
                45, 4, $img('1626790291085-19a27173773c'), 'Carnes',
                [['Pollo en dados', 600, 'g'], ['Curry en pasta', 3, 'cda'], ['Leche de coco', 400, 'ml'], ['Cebolla', 1, 'ud'], ['Jengibre', 20, 'g'], ['Arroz basmati', 300, 'g']],
                [
                    'Sofríe la cebolla picada con el jengibre rallado.',
                    'Añade la pasta de curry y rehoga 1 minuto. Incorpora el pollo y dora.',
                    'Vierte la leche de coco y cocina 20 minutos a fuego suave.',
                    'Cuece el arroz basmati y sirve junto al curry.',
                ],
            ],

            // ━━━━━━━━━━━━━━━━━━━━ ENSALADAS (6) ━━━━━━━━━━━━━━━━━━━━
            [
                'Ensalada César con pollo',
                'Lechuga romana, pollo a la plancha, picatostes y salsa César.',
                25, 2, $img('1546793665-c74683f339c1'), 'Ensaladas',
                [['Pechuga de pollo', 300, 'g'], ['Lechuga romana', 1, 'ud'], ['Pan en cubos', 80, 'g'], ['Parmesano', 40, 'g'], ['Salsa César', 60, 'ml'], ['Aceite', 20, 'ml']],
                [
                    'Trocea, lava y seca la lechuga. Reserva en frío.',
                    'Tuesta los cubos de pan en sartén con aceite hasta dorar.',
                    'Saltea el pollo cortado en tiras hasta que esté hecho.',
                    'Monta: lechuga, pollo, picatostes, parmesano y salsa al gusto.',
                ],
            ],
            [
                'Ensalada caprese',
                'Tomate, mozzarella y albahaca con un chorro de aceite — pura simplicidad.',
                10, 2, $img('1592417817038-d13fd7342605'), 'Ensaladas',
                [['Tomates rama', 3, 'ud'], ['Mozzarella di bufala', 250, 'g'], ['Albahaca fresca', 1, 'puñado'], ['Aceite virgen extra', 40, 'ml'], ['Sal en escamas', 1, 'pizca'], ['Vinagre balsámico', 10, 'ml']],
                [
                    'Corta los tomates en rodajas gruesas y la mozzarella igual.',
                    'Alterna en un plato: tomate, mozzarella, hoja de albahaca.',
                    'Riega con aceite y unas gotas de balsámico.',
                    'Termina con sal en escamas y sirve enseguida.',
                ],
            ],
            [
                'Ensalada griega',
                'Ensalada mediterránea con pepino, tomate, feta y aceitunas kalamata.',
                15, 4, $img('1573409157844-6a56035363fc'), 'Ensaladas',
                [['Tomate', 3, 'ud'], ['Pepino', 1, 'ud'], ['Cebolla roja', 0.5, 'ud'], ['Queso feta', 200, 'g'], ['Aceitunas kalamata', 100, 'g'], ['Orégano', 1, 'cdta']],
                [
                    'Trocea tomate, pepino y cebolla roja en cubos grandes.',
                    'Disponlos en un bol amplio.',
                    'Añade el feta en bloques y las aceitunas.',
                    'Riega con aceite, orégano, sal y un chorro de limón.',
                ],
            ],
            [
                'Ensalada de atún mediterránea',
                'Ensalada fresca con atún, judías blancas, tomate y aceitunas.',
                15, 4, $img('1551248429-40975aa4de74'), 'Ensaladas',
                [['Atún en aceite', 200, 'g'], ['Judías blancas cocidas', 200, 'g'], ['Tomate cherry', 250, 'g'], ['Cebolla roja', 0.5, 'ud'], ['Aceitunas verdes', 80, 'g'], ['Aceite y vinagre', 1, 'al gusto']],
                [
                    'Escurre las judías y mézclalas con los tomates partidos por la mitad.',
                    'Añade la cebolla en juliana fina y las aceitunas.',
                    'Incorpora el atún escurrido en lascas.',
                    'Aliña con aceite, vinagre y sal y sirve.',
                ],
            ],
            [
                'Ensalada Waldorf',
                'Ensalada clásica de manzana, apio, nueces y mayonesa.',
                15, 4, $img('1607532941433-304659e8198a'), 'Ensaladas',
                [['Manzanas Granny Smith', 2, 'ud'], ['Apio', 3, 'ramas'], ['Nueces', 80, 'g'], ['Uvas pasas', 50, 'g'], ['Mayonesa', 100, 'g'], ['Yogur natural', 50, 'g']],
                [
                    'Corta las manzanas en cubos pequeños sin pelar.',
                    'Pica el apio en trozos similares.',
                    'Mezcla la mayonesa con el yogur para aligerarla.',
                    'Combina todos los ingredientes y refrigera 30 minutos antes de servir.',
                ],
            ],
            [
                'Ensalada de quinoa y aguacate',
                'Bowl saciante con quinoa, aguacate, tomate cherry y limón.',
                25, 2, $img('1623428187969-5da2dcea5ebf'), 'Ensaladas',
                [['Quinoa', 200, 'g'], ['Aguacate', 1, 'ud'], ['Tomate cherry', 200, 'g'], ['Maíz dulce', 100, 'g'], ['Cilantro', 1, 'puñado'], ['Lima', 1, 'ud']],
                [
                    'Cuece la quinoa lavada en agua con sal 12 minutos. Escurre y enfría.',
                    'Corta el aguacate y los tomates por la mitad.',
                    'Mezcla quinoa, aguacate, tomate, maíz y cilantro picado.',
                    'Aliña con zumo de lima, aceite y sal. Sirve fresco.',
                ],
            ],

            // ━━━━━━━━━━━━━━━━━━━━ SOPAS (6) ━━━━━━━━━━━━━━━━━━━━
            [
                'Crema de calabaza asada',
                'Crema cremosa con calabaza al horno y un toque de jengibre.',
                50, 4, $img('1547592180-85f173990554'), 'Sopas',
                [['Calabaza pelada', 800, 'g'], ['Cebolla', 1, 'ud'], ['Caldo de verduras', 700, 'ml'], ['Jengibre', 10, 'g'], ['Nata para cocinar', 100, 'ml'], ['Aceite', 20, 'ml']],
                [
                    'Trocea calabaza y cebolla, asa a 200°C con aceite durante 30 minutos.',
                    'Pasa a una olla con caldo y jengibre rallado, lleva a ebullición.',
                    'Tritura todo hasta obtener una crema lisa.',
                    'Incorpora la nata, ajusta de sal y sirve caliente.',
                ],
            ],
            [
                'Gazpacho andaluz',
                'Sopa fría de tomate con pepino, pimiento y ajo. Refrescante.',
                20, 4, $img('1529566186297-155c18f9a434'), 'Sopas',
                [['Tomates maduros', 1, 'kg'], ['Pepino', 1, 'ud'], ['Pimiento verde', 1, 'ud'], ['Ajo', 1, 'diente'], ['Pan duro', 50, 'g'], ['Aceite virgen extra', 80, 'ml']],
                [
                    'Pela y trocea los tomates. Pela el pepino y trocéalo igual.',
                    'Pon todo en la batidora con el ajo, el pan, sal y un chorro de vinagre.',
                    'Tritura mientras incorporas el aceite en hilo.',
                    'Cuela si lo prefieres más fino y refrigera al menos 2 horas.',
                ],
            ],
            [
                'Sopa de fideos con pollo',
                'Caldo casero con fideos finos y trocitos de pollo. Reconfortante.',
                40, 4, $img('1470324161839-ce2bb6fa6bc3'), 'Sopas',
                [['Pollo en muslos', 500, 'g'], ['Fideos finos', 150, 'g'], ['Zanahoria', 1, 'ud'], ['Puerro', 1, 'ud'], ['Apio', 1, 'rama'], ['Sal', 1, 'pizca']],
                [
                    'Cuece el pollo con las verduras troceadas en 1.5L de agua durante 30 minutos.',
                    'Cuela el caldo, desmenuza el pollo y reserva.',
                    'Lleva el caldo a ebullición y echa los fideos.',
                    'Cuece según indicaciones, añade el pollo y sirve.',
                ],
            ],
            [
                'Crema de champiñones',
                'Crema sedosa de champiñones con un toque de nata y perejil.',
                30, 4, $img('1740797936651-c9148df80e07'), 'Sopas',
                [['Champiñones', 600, 'g'], ['Cebolla', 1, 'ud'], ['Caldo de pollo', 800, 'ml'], ['Nata', 150, 'ml'], ['Mantequilla', 30, 'g'], ['Perejil', 1, 'puñado']],
                [
                    'Lamina los champiñones y pica la cebolla.',
                    'Pocha la cebolla en mantequilla y añade los champiñones.',
                    'Cuando suelten el agua incorpora el caldo y cuece 15 minutos.',
                    'Tritura, añade la nata y sirve con perejil picado.',
                ],
            ],
            [
                'Sopa minestrone',
                'Sopa italiana con verduras de temporada, judías y pasta corta.',
                50, 6, $img('1611068120813-eca5a8cbf793'), 'Sopas',
                [['Judías blancas', 200, 'g'], ['Calabacín', 1, 'ud'], ['Zanahoria', 2, 'ud'], ['Apio', 2, 'ramas'], ['Tomate triturado', 200, 'g'], ['Pasta ditalini', 100, 'g']],
                [
                    'Sofríe zanahoria, apio y cebolla picados en aceite.',
                    'Añade el calabacín y el tomate, rehoga 5 minutos.',
                    'Incorpora 1.2L de caldo y las judías. Cuece 20 minutos.',
                    'Echa la pasta y cocina 8 minutos más. Sirve con parmesano.',
                ],
            ],
            [
                'Sopa de tomate casera',
                'Sopa cremosa de tomates asados con albahaca.',
                45, 4, $img('1530231391743-ea2c4268feb7'), 'Sopas',
                [['Tomates maduros', 1, 'kg'], ['Cebolla', 1, 'ud'], ['Ajo', 3, 'dientes'], ['Caldo de verduras', 500, 'ml'], ['Albahaca', 1, 'puñado'], ['Aceite', 40, 'ml']],
                [
                    'Asa los tomates partidos por la mitad con ajo y aceite a 200°C 25 minutos.',
                    'Pocha la cebolla en una olla aparte.',
                    'Une los tomates asados, la cebolla y el caldo. Cuece 10 minutos.',
                    'Tritura con la albahaca, ajusta sal y sirve caliente.',
                ],
            ],

            // ━━━━━━━━━━━━━━━━━━━━ ARROCES (6) ━━━━━━━━━━━━━━━━━━━━
            [
                'Paella valenciana',
                'Receta clásica con pollo, conejo, judía verde, garrofó y arroz bomba.',
                60, 6, $img('1515443961218-a51367888e4b'), 'Arroces',
                [['Arroz bomba', 400, 'g'], ['Pollo', 500, 'g'], ['Conejo', 400, 'g'], ['Judía verde', 200, 'g'], ['Tomate rallado', 1, 'ud'], ['Caldo', 1.2, 'l']],
                [
                    'Sofríe pollo y conejo en la paella con aceite y sal hasta dorar.',
                    'Añade la judía verde y rehoga 5 min. Incorpora el tomate.',
                    'Vierte el caldo caliente y reparte el arroz.',
                    'Cuece 10 min a fuego fuerte y 8 a fuego suave. Reposa antes de servir.',
                ],
            ],
            [
                'Arroz negro con sepia',
                'Arroz con tinta de calamar, sepia y un toque de alioli.',
                45, 4, $img('1516714435131-44d6b64dc6a2'), 'Arroces',
                [['Arroz bomba', 320, 'g'], ['Sepia', 400, 'g'], ['Tinta de calamar', 4, 'sobres'], ['Cebolla', 1, 'ud'], ['Tomate triturado', 100, 'g'], ['Caldo de pescado', 800, 'ml']],
                [
                    'Sofríe cebolla y tomate, añade la sepia troceada y rehoga.',
                    'Incorpora el arroz y la tinta diluida en un poco de caldo.',
                    'Vierte el caldo caliente y cuece 18 minutos.',
                    'Reposa 5 minutos y sirve con alioli.',
                ],
            ],
            [
                'Risotto de setas',
                'Risotto cremoso italiano con setas variadas y parmesano.',
                40, 4, $img('1518779578993-ec3579fee39f'), 'Arroces',
                [['Arroz arborio', 320, 'g'], ['Setas variadas', 300, 'g'], ['Caldo de pollo', 1, 'l'], ['Vino blanco', 100, 'ml'], ['Parmesano', 60, 'g'], ['Mantequilla', 50, 'g']],
                [
                    'Saltea las setas en mantequilla hasta dorar y reserva.',
                    'Pocha cebolla picada, añade el arroz y nácara 1 minuto.',
                    'Riega con vino, espera a que evapore y añade caldo cazo a cazo, removiendo.',
                    'A los 18 minutos incorpora setas, parmesano y mantequilla. Reposa 1 minuto.',
                ],
            ],
            [
                'Arroz a la cubana',
                'Arroz blanco con plátano frito, tomate frito y huevo plancha.',
                30, 2, $img('1551515834-0b9ed8b0d6e9'), 'Arroces',
                [['Arroz redondo', 200, 'g'], ['Plátano macho', 1, 'ud'], ['Tomate frito', 200, 'g'], ['Huevos', 2, 'ud'], ['Aceite', 50, 'ml'], ['Ajo', 1, 'diente']],
                [
                    'Cuece el arroz con un diente de ajo en abundante agua con sal.',
                    'Fríe el plátano laminado en aceite caliente hasta dorar.',
                    'Calienta el tomate frito y prepara los huevos a la plancha.',
                    'Sirve un molde de arroz con tomate, plátano y huevo encima.',
                ],
            ],
            [
                'Arroz salteado oriental',
                'Arroz al wok con verduras, huevo y salsa de soja.',
                25, 4, $img('1496116218417-1a781b1c416c'), 'Arroces',
                [['Arroz cocido del día anterior', 400, 'g'], ['Huevos', 2, 'ud'], ['Zanahoria', 1, 'ud'], ['Guisantes', 100, 'g'], ['Salsa de soja', 50, 'ml'], ['Aceite de sésamo', 1, 'cda']],
                [
                    'Calienta un wok con aceite y haz un revuelto rápido con los huevos. Reserva.',
                    'Saltea zanahoria en juliana y guisantes 3 minutos.',
                    'Añade el arroz frío y saltea a fuego fuerte sin parar de remover.',
                    'Incorpora el huevo, salsa de soja y aceite de sésamo. Sirve enseguida.',
                ],
            ],
            [
                'Arroz con leche',
                'Postre tradicional español de arroz cocido en leche con canela.',
                60, 4, $img('1590055619273-44b5b6ce52e8'), 'Arroces',
                [['Arroz redondo', 150, 'g'], ['Leche entera', 1, 'l'], ['Azúcar', 100, 'g'], ['Canela en rama', 1, 'ud'], ['Limón', 1, 'piel'], ['Canela en polvo', 1, 'pizca']],
                [
                    'Lleva la leche a ebullición con la canela y la piel de limón.',
                    'Añade el arroz y cuece a fuego muy suave 40 minutos removiendo.',
                    'Incorpora el azúcar y cuece 5 minutos más.',
                    'Sirve en cuencos y espolvorea canela en polvo. Frío o templado.',
                ],
            ],

            // ━━━━━━━━━━━━━━━━━━━━ VEGETARIANO (5) ━━━━━━━━━━━━━━━━━━━━
            [
                'Hummus casero con pita',
                'Crema suave de garbanzos con tahini, limón y comino.',
                15, 4, $img('1540420773420-3366772f4999'), 'Vegetariano',
                [['Garbanzos cocidos', 400, 'g'], ['Tahini', 60, 'g'], ['Zumo de limón', 30, 'ml'], ['Ajo', 1, 'diente'], ['Comino', 1, 'cdta'], ['Aceite virgen extra', 40, 'ml']],
                [
                    'Escurre los garbanzos y reserva un poco del líquido (aquafaba).',
                    'Tritura garbanzos, tahini, limón, ajo y comino.',
                    'Añade aceite poco a poco hasta lograr una crema lisa.',
                    'Sirve con aceite por encima, pimentón y pan de pita tibio.',
                ],
            ],
            [
                'Falafel con salsa de yogur',
                'Croquetas crujientes de garbanzos especiadas con salsa fresca de yogur.',
                40, 4, $img('1593504049359-74330189a345'), 'Vegetariano',
                [['Garbanzos secos remojados', 300, 'g'], ['Cebolla', 1, 'ud'], ['Ajo', 2, 'dientes'], ['Comino', 1, 'cdta'], ['Cilantro fresco', 1, 'puñado'], ['Yogur griego', 200, 'g']],
                [
                    'Tritura garbanzos crudos remojados con cebolla, ajo, especias y cilantro.',
                    'Forma bolitas y refrigera 30 minutos.',
                    'Fríe en aceite caliente hasta dorar por todos los lados.',
                    'Sirve con yogur mezclado con limón, ajo y pepino rallado.',
                ],
            ],
            [
                'Curry de garbanzos al estilo indio',
                'Garbanzos guisados en salsa especiada con tomate y leche de coco.',
                40, 4, $img('1587033649773-5c231faa21e3'), 'Vegetariano',
                [['Garbanzos cocidos', 400, 'g'], ['Tomate triturado', 400, 'g'], ['Leche de coco', 200, 'ml'], ['Cebolla', 1, 'ud'], ['Curry en polvo', 2, 'cda'], ['Jengibre', 15, 'g']],
                [
                    'Pocha la cebolla picada con el jengibre rallado.',
                    'Añade el curry, tuesta 1 minuto y echa el tomate.',
                    'Incorpora los garbanzos y la leche de coco. Cuece 20 minutos.',
                    'Ajusta de sal y sirve con arroz basmati o pan naan.',
                ],
            ],
            [
                'Berenjenas a la parmesana',
                'Berenjenas en capas con tomate, mozzarella y parmesano gratinadas.',
                70, 4, $img('1632229095740-8c75082087c5'), 'Vegetariano',
                [['Berenjenas', 2, 'ud'], ['Tomate triturado', 600, 'g'], ['Mozzarella', 200, 'g'], ['Parmesano', 80, 'g'], ['Albahaca', 1, 'puñado'], ['Aceite', 60, 'ml']],
                [
                    'Lamina las berenjenas, sálalas y déjalas escurrir 20 minutos.',
                    'Pásalas por la sartén con aceite hasta dorar.',
                    'Monta en una fuente: salsa de tomate, berenjena, mozzarella, parmesano. Repite capas.',
                    'Hornea a 200°C durante 25 minutos hasta gratinar.',
                ],
            ],
            [
                'Tabulé de quinoa con menta',
                'Ensalada libanesa fresca con quinoa, perejil, menta y limón.',
                30, 4, $img('1594040815645-5442fb6d48f6'), 'Vegetariano',
                [['Quinoa', 200, 'g'], ['Tomate', 2, 'ud'], ['Pepino', 1, 'ud'], ['Perejil fresco', 1, 'puñado'], ['Menta fresca', 1, 'puñado'], ['Limón', 1, 'ud']],
                [
                    'Cuece la quinoa lavada en agua con sal 12 minutos. Escurre y enfría.',
                    'Pica tomate y pepino en cubos muy pequeños.',
                    'Pica el perejil y la menta finamente.',
                    'Mezcla todo con zumo de limón, aceite y sal. Refrigera 1 hora antes de servir.',
                ],
            ],
        ];

        // Heurística simple basada en tiempo total (que es lo que más
        // varía entre recetas en este seed). Distribución resultante:
        //   - hard:   tiempo > 60 min (paella, lasaña, tarta, mousse...)
        //   - medium: tiempo 26–60 min (cremas, hummus al borde, pollo curry...)
        //   - easy:   tiempo ≤ 25 min (carbonara, hummus, smoothie bowl...)
        $calcularDificultad = static function (int $tiempo): string {
            if ($tiempo > 60) {
                return 'hard';
            }
            if ($tiempo > 25) {
                return 'medium';
            }
            return 'easy';
        };

        foreach ($recetas as [$nombre, $desc, $tiempo, $raciones, $imgUrl, $catNombre, $ings, $pasos]) {
            $receta = new Receta();
            $receta->setNombreReceta($nombre);
            $receta->setDescripcion($desc);
            $receta->setTiempo($tiempo);
            $receta->setRaciones($raciones);
            $receta->setImagenUrl($imgUrl);
            $receta->setDificultad($calcularDificultad($tiempo));
            $receta->setCreatedAt(new \DateTime());
            $receta->setUsuario($autor);
            $receta->setCategoria($categorias[$catNombre]);
            $manager->persist($receta);

            foreach ($ings as [$nombreIng, $cantidad, $unidad]) {
                $ing = new Ingrediente();
                $ing->setNombre($nombreIng);
                $ing->setCantidad((float) $cantidad);
                $ing->setUnidad($unidad);
                $ing->setReceta($receta);
                $manager->persist($ing);
            }

            foreach ($pasos as $i => $descripcionPaso) {
                $paso = new Paso();
                $paso->setNumeroPaso($i + 1);
                $paso->setDescripcion($descripcionPaso);
                $paso->setReceta($receta);
                $manager->persist($paso);
            }
        }

        $manager->flush();
    }
}
