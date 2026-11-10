# Prompts d'images IA — Phobos

Cinq images par phobie, d'intensité 0 à 4, réparties sur les quatre niveaux d'images du parcours (le niveau 5 est une vidéo YouTube). Les prompts sont en anglais, les générateurs les comprennent mieux.

## Mode d'emploi

1. Générer les cinq images d'une phobie avec le préfixe et le suffixe ci-dessous autour de chaque scène.
2. Les enregistrer dans `media-src/<slug>/` sous le nom indiqué (`1-a.png` … `4-b.png`, tout format d'image convient).
3. Depuis `web/` : `npm run media -- --declare-ai` (déclare les images dans `content/phobias/<slug>.json` et les convertit en WebP dans `media/`).
4. Vérifier dans le site, puis `./infra/upload-media.ps1` pour les envoyer sur Azure, puis commit et push des fichiers JSON.

Les générations non retenues vont dans `media-generated/` (hors git).

| Intensité | Fichier | Niveau du parcours |
|---|---|---|
| 0 | `1-a` | 1 — Apprivoiser |
| 1 | `2-a` | 2 — Approcher |
| 2 | `3-a` | 3 — Examiner |
| 3 | `4-a` | 4 — Confronter |
| 4 | `4-b` | 4 — Confronter (à côté de la précédente) |

## Préfixe et suffixe communs

**Préfixe** (remplacer N par l'intensité) :

> Photorealistic natural documentary photograph for a phobia website, intensity N/4.

**Suffixe** :

> The subject is clearly visible and recognizable, precise anatomy and natural proportions, ordinary believable scene, natural light, landscape 4:3, no text, watermark, logo, gore or collage.

Ce qui a marché pour les cinq premières phobies : un sujet qui occupe au moins un tiers de l'image (sinon il disparaît en vignette) ; aux intensités 3 et 4, une scène du quotidien vue à la première personne (une main, une porte, un drap) plutôt qu'un animal monstrueux.

## Garde-fous

- Rien de sanglant ni de mutilé, aucune blessure ouverte. Hémophobie : clinique et sobre.
- Trypophobie : uniquement des objets naturels (graines, nid d'abeilles, corail), jamais sur la peau.
- Pas de personne identifiable (mains, silhouettes, visages masqués ou flous), pas d'enfant en détresse.
- Mettre mal à l'aise, pas choquer.

## À refaire

- `entomophobia/1-a` : a single red ladybird with black spots resting on a green leaf, the ladybird large and sharply focused in the centre, filling a third of the frame
- `ophidiophobia/2-a` : a real grass snake crossing a woodland path a few meters ahead, its whole body clearly visible and contrasting with the path

## Faites (5 phobies)

Araignées, serpents, insectes, cafards, abeilles et guêpes : prompts utilisés dans `media-generated/prompts-generation.json`.

## Animaux

### 006 — Musophobie (`musophobia`)

- **0 → `1-a`** : a single small brown field mouse sitting on a mossy log in a forest, eating a seed, filling a third of the frame
- **1 → `2-a`** : a grey house mouse sitting on a kitchen floor near the skirting board, seen from standing height
- **2 → `3-a`** : a mouse inside an open kitchen drawer among cutlery and crumbs, caught in the light
- **3 → `4-a`** : a large brown rat on top of an overflowing kitchen bin at night, looking at the camera, eyes reflecting the flash
- **4 → `4-b`** : first-person view: opening a pantry door at night and finding three rats on the shelves among torn food packets, one rat very close to the hand on the door
- **Vidéo (niveau 5)** : « rats in sewer », « rat infestation »

### 007 — Cynophobie (`cynophobia`)

- **0 → `1-a`** : a calm golden retriever lying in the grass of a sunny park, seen from a few meters away
- **1 → `2-a`** : a large dog without a leash trotting toward the viewer on a quiet street, still at some distance
- **2 → `3-a`** : a big black dog behind a garden fence, standing on its hind legs against the fence, barking
- **3 → `4-a`** : a growling German shepherd in a driveway, teeth showing, ears back, staring at the viewer from close range
- **4 → `4-b`** : first-person view on a narrow rural path: two large barking dogs running straight at the camera, motion blur on their legs, very close
- **Vidéo (niveau 5)** : « aggressive guard dog barking »

### 008 — Ornithophobie (`ornithophobia`)

- **0 → `1-a`** : a single robin perched on a garden branch, clearly visible, soft morning light
- **1 → `2-a`** : a dozen pigeons gathered on a city square pavement close to the viewer's feet
- **2 → `3-a`** : a seagull landing on a cafe table right next to a plate of fries, wings spread
- **3 → `4-a`** : a crow perched on a balcony railing at arm's length, staring into the lens, sharp beak in focus
- **4 → `4-b`** : first-person view in a park: a flock of pigeons taking off all at once around the camera, wings filling the frame, feathers in the air
- **Vidéo (niveau 5)** : « birds attacking », « starling murmuration close »

### 009 — Chiroptophobie (`chiroptophobia`)

- **0 → `1-a`** : a single small brown bat hanging asleep under a wooden beam, wings folded, seen from a few meters away
- **1 → `2-a`** : a bat flying across an orange evening sky above rooftops, clearly recognizable silhouette
- **2 → `3-a`** : a bat clinging to the outside of a lit window at night, wings half open, seen from inside the room
- **3 → `4-a`** : a bat flying inside a dark bedroom, caught in the flash in mid-air, wings fully spread
- **4 → `4-b`** : first-person view with a flashlight in an attic: dozens of bats hanging from the rafters just above the head, some taking flight toward the light
- **Vidéo (niveau 5)** : « bats leaving cave », « bat close up »

### 010 — Batrachophobie (`batrachophobia`)

- **0 → `1-a`** : a small bright green tree frog sitting on a leaf, clearly visible, filling a third of the frame
- **1 → `2-a`** : a brown toad sitting on a garden path in the evening, seen from standing height
- **2 → `3-a`** : a large toad on a doorstep right next to a shoe, warty skin in sharp detail
- **3 → `4-a`** : a frog sitting on the edge of a bathroom sink, wet skin glistening under the light
- **4 → `4-b`** : first-person view: lifting a garden watering can and finding several large wet toads underneath, one at the fingertips
- **Vidéo (niveau 5)** : « toad close up », « frog swarm road »

### 011 — Scoléciphobie (`scoleciphobia`)

- **0 → `1-a`** : a single earthworm on dark garden soil after the rain, clearly visible, seen from above
- **1 → `2-a`** : several earthworms on a wet pavement after a rain shower, seen from standing height
- **2 → `3-a`** : a garden spade lifting a clump of soil full of wriggling earthworms
- **3 → `4-a`** : a close photograph of a tangle of earthworms in compost, moist and moving
- **4 → `4-b`** : first-person view: hands digging into garden soil and pulling up a dense knot of many earthworms
- **Vidéo (niveau 5)** : « worms after rain », « worm farm close »

### 012 — Sélachophobie (`selachophobia`)

- **0 → `1-a`** : a small reef shark swimming calmly in clear shallow water, seen from a distance, sunlight rays
- **1 → `2-a`** : a shark fin breaking the calm surface of the sea some distance from a beach
- **2 → `3-a`** : underwater view: a large shark passing below a snorkeler in deep blue water
- **3 → `4-a`** : underwater view: a large shark swimming directly toward the camera, mouth slightly open, close
- **4 → `4-b`** : first-person view from a small boat: a great white shark surfacing right beside the hull, head out of the water, very close
- **Vidéo (niveau 5)** : « great white shark breach », « shark cage diving »

### 013 — Lépidoptérophobie (`lepidopterophobia`)

- **0 → `1-a`** : a single colourful butterfly resting on a flower in a garden, clearly visible
- **1 → `2-a`** : a large brown moth resting on a white wall next to a lamp at night
- **2 → `3-a`** : several moths fluttering around a porch light at night
- **3 → `4-a`** : a large moth landing on a person's shirt sleeve, wings spread, dusty scales visible
- **4 → `4-b`** : first-person view: opening a wardrobe and dozens of moths flying out toward the face
- **Vidéo (niveau 5)** : « moths around light », « butterfly proboscis macro »

## Nature & espaces

### 014 — Acrophobie (`acrophobia`)

- **0 → `1-a`** : a view from a low garden wall over a meadow, a gentle drop of one meter, peaceful
- **1 → `2-a`** : a view from a fifth-floor balcony looking down at a street, railing in the foreground
- **2 → `3-a`** : a person's feet on a glass-floored skywalk high above a valley
- **3 → `4-a`** : a narrow mountain ridge trail with steep drops on both sides, seen from the hiker's viewpoint
- **4 → `4-b`** : first-person view looking straight down between one's own shoes from the edge of a skyscraper roof, street far below
- **Vidéo (niveau 5)** : « skyscraper climbing POV », « glass bridge »

### 015 — Claustrophobie (`claustrophobia`)

- **0 → `1-a`** : a cosy small reading nook with an open window and soft light
- **1 → `2-a`** : a crowded lift with the doors closing, seen from inside
- **2 → `3-a`** : a narrow cave passage lit by a headlamp, walls close on both sides
- **3 → `4-a`** : inside an MRI tunnel, seen from the patient's position, ceiling very close
- **4 → `4-b`** : first-person view crawling through a very tight dark crawl space under a house, ceiling touching the back, flashlight beam
- **Vidéo (niveau 5)** : « cave squeeze », « tight crawl space »

### 016 — Thalassophobie (`thalassophobia`)

- **0 → `1-a`** : a calm turquoise sea seen from a sandy beach, clear shallow water
- **1 → `2-a`** : the view from a paddleboard over dark deep blue water, no bottom visible
- **2 → `3-a`** : an underwater view looking down into a dark blue abyss, a diver small below
- **3 → `4-a`** : an underwater view in murky water where a huge dark shape is barely visible far below
- **4 → `4-b`** : first-person view treading water alone in the open ocean, dark water below, a vast shadow passing underneath
- **Vidéo (niveau 5)** : « deep ocean drop off », « open water diving »

### 017 — Nyctophobie (`nyctophobia`)

- **0 → `1-a`** : a bedroom at dusk with a small night light glowing, calm atmosphere
- **1 → `2-a`** : a dark hallway at night lit only by the light of a door left ajar
- **2 → `3-a`** : a forest path at night lit only by a flashlight beam, trees fading into black
- **3 → `4-a`** : a dark basement staircase seen from the top, the bottom completely black
- **4 → `4-b`** : first-person view in a pitch-black room with a phone screen light revealing only a doorway and a vague shape
- **Vidéo (niveau 5)** : « dark forest at night », « abandoned house night »

### 018 — Astraphobie (`astraphobia`)

- **0 → `1-a`** : distant storm clouds over a sunny countryside, peaceful
- **1 → `2-a`** : a lightning bolt far away over the sea at dusk, seen from a beach
- **2 → `3-a`** : heavy rain and a lightning strike over a city seen through a window
- **3 → `4-a`** : a lightning bolt striking a tree nearby in a field, bright flash, sparks
- **4 → `4-b`** : first-person view under a dark sky as lightning strikes very close, blinding flash, rain everywhere
- **Vidéo (niveau 5)** : « lightning strike close », « supercell timelapse »

### 019 — Pyrophobie (`pyrophobia`)

- **0 → `1-a`** : a single candle flame in a calm room, warm light
- **1 → `2-a`** : a campfire burning in a stone ring at night, people far away
- **2 → `3-a`** : a pan on a kitchen stove catching fire, flames rising
- **3 → `4-a`** : a hedge burning next to a house at night, smoke billowing
- **4 → `4-b`** : first-person view at the door of a room engulfed in flames and smoke, heat haze, very close
- **Vidéo (niveau 5)** : « wildfire near road », « flashover »

### 020 — Mégalophobie (`megalophobia`)

- **0 → `1-a`** : a large cargo ship far out at sea seen from a beach
- **1 → `2-a`** : a huge wind turbine seen from its base, blades turning
- **2 → `3-a`** : standing next to the enormous hull of a ship in a dry dock
- **3 → `4-a`** : a gigantic dam wall seen from below, water spilling
- **4 → `4-b`** : first-person view from a small boat as an enormous cargo ship passes very close, its hull filling the sky
- **Vidéo (niveau 5)** : « huge ship passing close », « megastructure »

### 021 — Submécanophobie (`submechanophobia`)

- **0 → `1-a`** : an old anchor resting on a sandy seabed in clear shallow water
- **1 → `2-a`** : a small sunken rowing boat in clear water near a jetty
- **2 → `3-a`** : an underwater view of a sunken car covered in algae in a lake
- **3 → `4-a`** : an underwater view of a huge rusted ship propeller in murky water
- **4 → `4-b`** : first-person diving view toward an enormous dark shipwreck hull emerging from green murky water
- **Vidéo (niveau 5)** : « underwater shipwreck », « propeller underwater »

## Corps & santé

### 022 — Hémophobie (`hemophobia`)

- **0 → `1-a`** : a small adhesive bandage on a fingertip, clean and simple, soft light
- **1 → `2-a`** : a single drop of blood on a fingertip after a glucose test, clinical setting
- **2 → `3-a`** : a blood test tube filling on a medical tray, nurse's gloved hands
- **3 → `4-a`** : a tissue with a small fresh blood stain held by a hand after a nosebleed, no face visible
- **4 → `4-b`** : first-person view of a blood donation: the tube full of dark blood running from the arm into the bag
- **Vidéo (niveau 5)** : « blood donation procedure »

### 023 — Trypanophobie (`trypanophobia`)

- **0 → `1-a`** : a capped syringe lying on a clean medical tray, neutral setting
- **1 → `2-a`** : a nurse preparing an injection, needle pointing up, a drop at the tip
- **2 → `3-a`** : a needle about to touch the skin of an arm, cotton swab nearby
- **3 → `4-a`** : a needle inserted into the inner elbow during a blood test, close-up
- **4 → `4-b`** : first-person view of one's own arm as a long needle goes in, tourniquet tight, very close
- **Vidéo (niveau 5)** : « blood draw close up », « IV insertion »

### 024 — Mysophobie (`mysophobia`)

- **0 → `1-a`** : a clean bathroom sink with soap and a towel, bright and tidy
- **1 → `2-a`** : a sticky public handrail in a subway seen from close up
- **2 → `3-a`** : a sink full of dirty dishes with mould spots
- **3 → `4-a`** : a public toilet with a dirty floor and an overflowing bin
- **4 → `4-b`** : first-person view of hands touching a slimy, mouldy surface in a dumpster area
- **Vidéo (niveau 5)** : « bacteria under microscope », « dirty phone microscope »

### 025 — Odontophobie (`odontophobia`)

- **0 → `1-a`** : a bright modern dental office waiting room, calm, nobody in it
- **1 → `2-a`** : a dentist's chair with the overhead light switched on, instruments on a tray
- **2 → `3-a`** : dental instruments, a mirror and a probe, laid out on a tray in close-up
- **3 → `4-a`** : a dentist leaning over the viewer holding a drill, masked, seen from the patient's position
- **4 → `4-b`** : first-person view from the dental chair: a drill and a suction tube coming toward the open mouth, bright light in the eyes
- **Vidéo (niveau 5)** : « dental drill sound », « tooth extraction »

### 026 — Trypophobie (`trypophobia`)

- **0 → `1-a`** : a single honeycomb frame held by a beekeeper, neat and golden
- **1 → `2-a`** : a slice of bread showing many small irregular holes, close-up
- **2 → `3-a`** : a dried lotus seed pod, close-up of its holes
- **3 → `4-a`** : a coral surface covered in dense small holes, close-up
- **4 → `4-b`** : an extreme macro of a dried lotus seed pod filling the frame, dense clusters of holes (never on skin)
- **Vidéo (niveau 5)** : « lotus seed pod », « surinam toad »

## Étrange

### 027 — Coulrophobie (`coulrophobia`)

- **0 → `1-a`** : a red clown nose and a juggling ball on a table, no person
- **1 → `2-a`** : a clown at a garden party seen from afar, balloons, daylight
- **2 → `3-a`** : a clown standing alone at the end of an empty street at dusk, staring
- **3 → `4-a`** : a clown face close-up with smeared make-up and a fixed smile
- **4 → `4-b`** : first-person view opening a dark wardrobe and finding a clown standing inside, smiling, very close
- **Vidéo (niveau 5)** : « creepy clown », « clown sighting »

### 028 — Pédiophobie (`pediophobia`)

- **0 → `1-a`** : a simple cloth doll sitting on a sunny bed
- **1 → `2-a`** : an old porcelain doll on a shelf, glass eyes looking at the viewer
- **2 → `3-a`** : a row of antique dolls on an attic shelf, all faces toward the camera
- **3 → `4-a`** : a porcelain doll with a cracked cheek sitting in a rocking chair in a dim room
- **4 → `4-b`** : first-person view switching on a bedside lamp and finding a porcelain doll sitting on the pillow right next to the face
- **Vidéo (niveau 5)** : « haunted doll », « porcelain doll collection »

### 029 — Phasmophobie (`phasmophobia`)

- **0 → `1-a`** : a bedsheet ghost costume hanging on a coat hook, playful
- **1 → `2-a`** : an empty dim hallway with a door slightly ajar at the end
- **2 → `3-a`** : a pale blurred figure standing at the end of a dark corridor
- **3 → `4-a`** : a bathroom mirror reflecting a silhouette that is not in the room
- **4 → `4-b`** : first-person view turning on a hallway light and seeing a pale figure right behind the door
- **Vidéo (niveau 5)** : « ghost caught on camera », « haunted house »

### 030 — Aérophobie (`aerophobia`)

- **0 → `1-a`** : an airplane flying high in a clear blue sky, seen from the ground
- **1 → `2-a`** : a view of the wing through a cabin window above calm clouds
- **2 → `3-a`** : an airplane cabin during light turbulence, drinks shaking on tray tables
- **3 → `4-a`** : the view of a wing through a window in a thunderstorm, lightning in the distance
- **4 → `4-b`** : first-person view of an airplane cabin in severe turbulence, oxygen masks dropping, objects in the air
- **Vidéo (niveau 5)** : « severe turbulence », « airplane storm landing »
