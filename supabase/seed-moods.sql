-- Seed data: preset mood assets (official Kanojo Studio assets)
-- "user" = NULL means official Kanojo Studio asset (public by convention)

-- ============================================
-- Emotional Tones
-- ============================================

INSERT INTO assets ("user", name, description, type, content) VALUES
(NULL, 'melancholic', 'Wistful sadness and quiet longing', 'mood',
  'A deep sense of wistful melancholy permeates the image. The subject carries a quiet sadness in their expression — distant eyes, slightly parted lips, a weight in their posture. Colors lean toward muted blues, desaturated tones, and cool shadows. The atmosphere feels like a rainy afternoon, still and heavy with unspoken emotion. Everything is soft, subdued, and achingly beautiful.'),

(NULL, 'joyful', 'Radiant happiness and infectious warmth', 'mood',
  'Pure, radiant joy fills every element of the image. The subject beams with genuine happiness — bright eyes, natural laughter, open and relaxed body language. Colors are warm and saturated: golden yellows, soft oranges, vibrant greens. The atmosphere is sun-drenched and alive, like the peak of a perfect day. Energy is high but effortless, celebratory and free.'),

(NULL, 'serene', 'Deep calm and peaceful stillness', 'mood',
  'A profound sense of peace and stillness defines the image. The subject is deeply calm — gentle closed-lip smile, relaxed shoulders, meditative presence. Colors are soft pastels, pale blues, gentle whites, and muted earth tones. The atmosphere is hushed and tranquil, like early morning mist over water. Everything breathes slowly, unhurried and harmonious.'),

(NULL, 'fierce', 'Intense power and unapologetic confidence', 'mood',
  'Raw intensity and unapologetic power radiate from the image. The subject commands attention — sharp gaze, strong jawline set with purpose, bold and deliberate posture. Colors are high-contrast: deep blacks, striking reds, metallic golds. The atmosphere crackles with tension and authority. Every element is precise, powerful, and demands respect.'),

(NULL, 'romantic', 'Tender intimacy and soft affection', 'mood',
  'Tender romance and soft intimacy saturate the image. The subject exudes gentle warmth — soft gaze, slight blush, delicate and inviting body language. Colors are warm roses, blush pinks, soft champagne, and candlelit amber. The atmosphere feels like a whispered confession, close and personal. Everything glows with affection and vulnerability.'),

(NULL, 'mysterious', 'Enigmatic allure and hidden depth', 'mood',
  'An air of enigma and intrigue defines the image. The subject is captivating yet unreadable — half-lidded eyes, knowing expression, body angled away as if guarding secrets. Colors are deep and shadowy: midnight blues, smoky purples, charcoal blacks. The atmosphere is thick with suggestion, like a dimly lit corridor. Every detail invites curiosity but reveals nothing.'),

(NULL, 'playful', 'Lighthearted fun and mischievous charm', 'mood',
  'Lighthearted mischief and carefree charm radiate from the image. The subject is animated and spontaneous — sparkling eyes, teasing smile, dynamic and loose body language. Colors are bright and punchy: candy pastels, vivid pops of color, playful contrasts. The atmosphere is bubbly and energetic, like a spontaneous adventure. Nothing is taken too seriously.'),

(NULL, 'vulnerable', 'Raw openness and emotional exposure', 'mood',
  'Raw emotional openness defines the image. The subject is unguarded and exposed — glistening eyes, bare expression, body language that is small and tender. Colors are pale and washed: soft grays, faded lavenders, gentle skin tones with minimal contrast. The atmosphere is intimate and fragile, like a held breath. Every element feels honest and unprotected.');


-- ============================================
-- Cinematic Vibes
-- ============================================

INSERT INTO assets ("user", name, description, type, content) VALUES
(NULL, 'film-noir', 'Classic black-and-white cinematic drama', 'mood',
  'Classic film noir atmosphere drenches the image in dramatic monochrome tension. The subject is framed in stark chiaroscuro — deep shadows carving the face, a single hard light source creating sharp contrasts. Expression is guarded, world-weary, and magnetic. The palette is pure black and white with rich silver midtones. The atmosphere is smoky, suspenseful, and fatalistic, like a 1940s detective thriller.'),

(NULL, 'golden-hour-dream', 'Warm sunset glow and hazy magic', 'mood',
  'Ethereal golden hour light bathes the entire image in warm, honeyed magic. The subject is luminous — skin glowing amber, hair catching light like spun gold, expression soft and dreamy. Colors are rich warm tones: burnt orange, deep gold, soft peach, and violet shadows. The atmosphere is hazy and dreamlike, with lens flare and soft bokeh. Everything feels like the last beautiful minute before sunset.'),

(NULL, 'cyberpunk', 'Neon-soaked futuristic edge', 'mood',
  'Electric neon energy pulses through every pixel of the image. The subject is sharp and futuristic — intense gaze, angular posture, an attitude of digital rebellion. Colors are vivid neon: hot magenta, electric cyan, acid green against deep black. The atmosphere is rain-slicked and synthetic, like a Tokyo alley at 2am. Reflections, chromatic aberration, and hard-edged light create a hyper-modern, dystopian feel.'),

(NULL, 'vintage-nostalgia', 'Faded warmth of old photographs', 'mood',
  'The warm, faded quality of a cherished old photograph defines the image. The subject has a timeless, analog quality — soft expression, classic pose, unhurried presence. Colors are desaturated warm tones: sepia, faded yellows, soft browns, and creamy whites with gentle grain. The atmosphere is nostalgic and tender, like a memory preserved in amber. Slight vignetting and soft focus at the edges.'),

(NULL, 'editorial-cold', 'High-fashion icy precision', 'mood',
  'Crisp, high-fashion coldness commands the image with surgical precision. The subject is striking and untouchable — razor-sharp expression, sculptural posture, absolute composure. Colors are icy and clinical: steel blue, pure white, pale silver, and cool gray. The atmosphere is polished and detached, like a luxury magazine spread. Every element is controlled, minimal, and devastatingly chic.');


-- ============================================
-- Energy Levels
-- ============================================

INSERT INTO assets ("user", name, description, type, content) VALUES
(NULL, 'ethereal', 'Otherworldly and dreamlike', 'mood',
  'An otherworldly, dreamlike quality transcends the image beyond reality. The subject appears almost supernatural — luminous skin, faraway gaze, floating and weightless body language. Colors are soft and iridescent: pearl whites, pale lilacs, shimmering silvers, and translucent blues. The atmosphere is misty and celestial, like existing between worlds. Light wraps around everything with an impossible softness.'),

(NULL, 'dramatic', 'High intensity and theatrical power', 'mood',
  'Theatrical intensity and high-stakes energy electrify the image. The subject is fully charged — piercing eyes, taut expression, coiled and dynamic posture. Colors are bold and extreme: deep saturated darks against bright concentrated highlights. The atmosphere is operatic and charged, like the climax of a film. Lighting is aggressive with hard shadows and dramatic falloff. Nothing is subtle.'),

(NULL, 'meditative', 'Centered stillness and inner focus', 'mood',
  'Deep inner stillness and centered awareness define the image. The subject is fully present — eyes softly focused or gently closed, breathing visible in relaxed shoulders, grounded and balanced posture. Colors are natural and understated: sage greens, warm earth tones, soft sand, and gentle diffused light. The atmosphere is temple-quiet and contemplative. Every element supports a sense of mindful, unhurried presence.'),

(NULL, 'energetic', 'Bold dynamism and vibrant life force', 'mood',
  'Explosive vitality and bold dynamism surge through the image. The subject is fully alive — wide bright eyes, expressive movement, strong and expansive body language. Colors are punchy and saturated: vivid reds, electric blues, hot yellows, and high contrast throughout. The atmosphere is kinetic and exhilarating, like the peak of a celebration. Motion blur, sharp focus, and high energy in every element.');
