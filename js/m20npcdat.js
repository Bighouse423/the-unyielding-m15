'use strict';
// m20: chapel spirit scripts, parsed from reports/m20/npc_design.md section 5 (do not hand-edit; rerun parse_npc.py)
window.M20NPC_DATA = {
"wick": {
"name": "BROTHER WICK",
"beats": [
{
"id": "W1",
"rank": 1,
"req": "first Chapel visit (after the prologue)",
"lines": [
{
"t": "Ah. A customer. Or a corpse. Hard to tell in this light."
},
{
"t": "Brother Wick. Sexton of this chapel, keeper of the last candle, and, since nobody else turned up, everything else."
},
{
"t": "Offer your shards at the altar. I'll keep the books. And the commentary."
}
],
"reply": null,
"syn": "A monk with a candle for a face keeps the Chapel's books. He says shards buy things. He is too small to be lying."
},
{
"id": "W2",
"rank": 0,
"req": "`stats.runs >= 1`",
"lines": [
{
"t": "Back already. Good? Bad? I never know which column."
},
{
"t": "The candle pulls you home by the collar every time. Gently. Like a mother. A mother with a hook."
}
],
"reply": {
"a": "Why does it?",
"ra": [
"Ask the proud gentleman on the right. Dead since before I was born. Terribly well-spoken."
],
"b": "I'll manage.",
"rb": [
"They all say that. Mind the hook."
]
},
"syn": "I died and the candle dragged me home. Wick says it does that. I'm starting to take it personally."
},
{
"id": "W3",
"rank": 0,
"req": "`stats.runs >= 2`",
"lines": [
{
"t": "I keep a column for your deaths, Baron. It's longer than the one for your victories."
},
{
"t": "Don't look like that. It's a very neat column."
}
],
"reply": {
"a": "How long?",
"ra": [
"{runs} descents. Most of them ended on my floor. Bleeding. I'll mop."
],
"b": "Don't.",
"rb": [
"Noted. Underlined, even."
]
},
"syn": "Wick keeps a column for my deaths. He assures me it's neat. I asked him not to read it out."
},
{
"id": "W4",
"rank": 0,
"req": "W3",
"lines": [
{
"t": "Shards. You wanted to know what they are."
},
{
"t": "Every dead thing down there carries a splinter of the stolen sunrise. Break the thing, the splinter falls out."
},
{
"t": "The candle eats them. It's the only meal it likes. The rest, I make up as I go."
}
],
"reply": null,
"syn": "Shards are splinters of the stolen sunrise. Kill the thing, it drops one, the candle eats it. Wick makes up the rest."
},
{
"id": "W5",
"rank": 2,
"req": "`stats.runs >= 5`",
"lines": [
{
"t": "Five descents. The flame leans toward the iron door when you leave now. Like a hound."
},
{
"t": "That earns you the second shelf. Quieter stock. Trinkets for people who plan to survive."
}
],
"reply": null,
"syn": "Five descents. The candle leans toward the door when I go. Wick opened a second shelf for me."
},
{
"id": "W6",
"rank": 0,
"req": "W5",
"lines": [
{
"t": "I was meant to guard the candle for five minutes while the Order marched out."
},
{
"t": "That was four hundred years ago. I'm still not sure anyone told me the rest of the plan."
},
{
"t": "Don't be sentimental about me. I've been wax longer than I was a man."
}
],
"reply": null,
"syn": "Wick was told to watch the candle for five minutes. That was four hundred years ago."
},
{
"id": "W7",
"rank": 0,
"req": "W6 and at least 3 other spirits present",
"lines": [
{
"t": "Look at the pews. Filling up. Light draws company."
},
{
"t": "Mind who you thank, though. A few of them were sentenced here. The rest walked in on their own, which is worse."
}
],
"reply": null,
"syn": "The Chapel is filling. Wick says some of the dead here were sentenced and some chose it."
},
{
"id": "W8",
"rank": 0,
"req": "W7 + Auberon A4",
"lines": [
{
"t": "I should have said this sooner. The candle isn't the Order's any more."
},
{
"t": "The First Baron lit it with an oath. Your blood keeps the wick. If you ever stop coming back, it goes out."
},
{
"t": "Then I go out. No pressure."
}
],
"reply": null,
"syn": "The candle is mine to keep burning. If I stop coming back it goes out, and Wick with it. No pressure, he said."
},
{
"id": "W9",
"rank": 3,
"req": "`stats.wins >= 1`",
"lines": [
{
"t": "The Lich is dust and the candle burned so tall it scorched my ceiling. I've been spilling wax for an hour. I'm thrilled."
},
{
"t": "The whole Ledger is yours now. Next best buy, lifetime tallies, all of it. You'll ignore my advice. I'll write that down too."
}
],
"reply": null,
"syn": "The Lich is dust. Wick gave me the whole Ledger and a list of what to buy. I will ignore the list."
},
{
"id": "W10",
"rank": 0,
"req": "the Vigil has happened (section 7)",
"lines": [
{
"t": "Four hundred years standing. May I sit?"
},
{
"t": "...The flame has stopped flickering. Has it always been this steady? Good. I'd like to be steady for a while."
}
],
"reply": null,
"syn": "Wick sat down in the front pew. His flame stopped flickering. I left him alone with it."
}
],
"react": {
"EARLY": "Stage {stage}. Brave. Short, but brave.",
"MID": "Stage {stage}. Respectable. I'll write 'respectable.'",
"LATE": "Stage {stage}! I had money on you. Not much. Wax is cheap.",
"BOSS": "Slain by {by}. I'll spell it right in the book.",
"HAZARD": "The floor again. I do wish it'd leave my customers alone.",
"NEWBEST": "A new best. I had to start a fresh page.",
"WIN": "You WON. I need to sit down. I can't. I've tried.",
"ABYSS": "Depth {abyss}. Below the throne. I have no column for that.",
"BROKE": "Empty pockets? The altar accepts promises. The candle doesn't.",
"RICH": "{shards} shards. Do spend them before they spoil."
},
"barks": [
"Mind the wax.",
"Prices are firm. Opinions are free.",
"Nobody ever thanks the sexton. Don't start.",
"You're standing in my one good draught."
],
"rem": {
"s1": {
"lines": [
"The First Candle. I lit the second. Nobody wrote that down."
],
"syn": "I gave Wick the page on the first candle. He says he lit the second. Nobody wrote that down."
},
"s2": {
"lines": [
"The salt. Aye, the walls sweat. The monks called it grief. I called it damp. We were both right."
],
"syn": "Wick says the catacomb walls sweat damp. The monks called it grief. They were both right."
}
}
},
"auberon": {
"name": "AUBERON KAEL",
"beats": [
{
"id": "A1",
"rank": 1,
"req": "arrival (first Chapel visit with `stats.runs >= 1`)",
"lines": [
{
"t": "You wear my house's black badly, boy."
},
{
"t": "Auberon Kael. First Baron. Your grandfather, with a great many prefixes."
},
{
"t": "You'll come back each time. That is a family trait, not a mercy. Sit with that. Then spend your shards on the Blessings; I can teach you those."
}
],
"reply": null,
"syn": "A dead man in an old tabard says he's my first grandfather. He teaches the Blessings. He thinks I wear the family black badly."
},
{
"id": "A2",
"rank": 0,
"req": "A1 and `stats.runs >= 2`",
"lines": [
{
"t": "Do you remember the night they marched out of this chapel?"
}
],
"reply": {
"a": "The banner.",
"ra": [
"Good. Hold on to the banner. The rest returns in the order it hurts."
],
"b": "Nothing.",
"rb": [
"The candle keeps the body and shaves the memory. That is the cost. I'm sorry."
]
},
"syn": "The candle keeps my body and shaves my memory. Auberon says it will come back in the order it hurts."
},
{
"id": "A3",
"rank": 0,
"req": "A2 and `best.stage >= 3`",
"lines": [
{
"t": "You have reached the Ossuary. Look at the hilts set in the wall, third row."
},
{
"t": "Ten thousand who tried before you. Nine of them were mine."
}
],
"reply": null,
"syn": "The Ossuary's walls hold the failed attempts. Nine of the hilts were Kaels. Auberon looked at them a long time."
},
{
"id": "A4",
"rank": 0,
"req": "A3 and `stats.runs >= 4`",
"lines": [
{
"t": "The Oath of the Candle. I will say it once: 'While a Kael keeps the oath, the dawn has a keeper.'"
},
{
"t": "I swore it in a plague winter, to a candle, expecting nothing. The candle answered. I have been explaining that to the dead ever since."
},
{
"t": "It will not let a Kael stay dead. Whether that is a gift or a leash depends on the week."
}
],
"reply": null,
"syn": "The Oath of the Candle: while a Kael keeps the oath, the dawn has a keeper. The candle won't let a Kael stay dead. Gift or leash depends on the week."
},
{
"id": "A5",
"rank": 2,
"req": "A4 and `best.stage >= 6`",
"lines": [
{
"t": "Stage six. Past my old hunting grounds. Your sword arm has stopped apologising."
},
{
"t": "Then I'll teach you more. The second tier. The blood remembers what the head forgot."
}
],
"reply": null,
"syn": "Auberon taught me the second tier of Blessings. The blood remembers what my head forgot."
},
{
"id": "A6",
"rank": 3,
"req": "A5 and `best.stage >= 8`",
"lines": [
{
"t": "You will ask whether you were chosen. Like the heroes in the old songs. The ones with the whips and the swords of destiny."
},
{
"t": "No god chose you, Kael. The god left. The candle chose, and a candle cannot choose. It burns whoever holds it."
},
{
"t": "'Chosen' is a story people tell afterwards. Right now you are simply the one still standing. That will do. Third tier, boy. Take it."
}
],
"reply": null,
"syn": "No god chose me. The god left. The candle burns whoever holds it. Auberon says \"chosen\" is a story told afterwards. Third tier of Blessings is mine."
},
{
"id": "A7",
"rank": 0,
"req": "A6 + Isolde I4",
"lines": [
{
"t": "She has told you about the vault."
},
{
"t": "Yes. I knew. The candle showed me the night you fell in the nave. I have watched you pay for it ever since."
},
{
"t": "Hear me. I do not forgive you. I saw what the Lich did to my house. But I know why you opened the door, and why you burned the banner. That is the only forgiveness I have."
},
{
"t": "Two oaths hold you: the blood oath you swore to Osric, and ours. Death cannot choose between them, so it declines. That is why you come back, and why you are, God help us, Unyielding."
}
],
"reply": null,
"syn": "I opened the vault myself. Auberon knew all along. Two oaths hold me, Osric's and the Candle's, and death can't choose between them. That's why I keep coming back."
},
{
"id": "A8",
"rank": 0,
"req": "A7 and `stats.wins >= 1`",
"lines": [
{
"t": "Osric. That was his name before it was 'the Lich.' Kin, in the way a wound is kin."
},
{
"t": "He was never the dark, Kael. He was the cork. What is under that throne was there before him, and it will be there after, unless someone stops it with something that is not a crown."
}
],
"reply": null,
"syn": "The Lich's name was Osric. Kin, the way a wound is kin. Auberon says he was only the cork. The dark under the throne is older."
},
{
"id": "A9",
"rank": 0,
"req": "A8 and the Black Baron present",
"lines": [
{
"t": "The knight in the pew. Do not hate him. I spent four hundred years hating a version of myself. It is exhausting."
},
{
"t": "He is the oath you swore with your whole heart. You cannot pay a debt by pretending you never signed."
}
],
"reply": null,
"syn": "Auberon says don't hate the Black Baron. He's the oath I swore with my whole heart. A debt isn't paid by pretending I never signed."
},
{
"id": "A10",
"rank": 0,
"req": "Vigil",
"lines": [
{
"t": "Well, boy.",
"act": "sets down his helm"
},
{
"t": "The line holds. It was never about the sword. It was about someone getting up."
},
{
"t": "Go on. Take the next stair. I'll keep the pew warm."
}
],
"reply": null,
"syn": "Auberon put down his helm. He said the line was never about the sword, only about someone getting up."
}
],
"react": {
"EARLY": "Stage {stage}. Ours was a long line of early deaths. You are in good company.",
"MID": "Stage {stage}. My third son reached stage {stage}. He wept at the view.",
"LATE": "Stage {stage}. Now you make the ancestors nervous.",
"BOSS": "{by}. Remember where it swung from. Then take its arm.",
"HAZARD": "The floor killed you. It has killed better men. Mind your feet.",
"NEWBEST": "Farther than I ever got. Do not tell Wick I said so.",
"WIN": "...You did it. I said nothing. I am saying nothing.",
"ABYSS": "Below the throne. I never learned what is down there. Tell me when you do."
},
"barks": [
"Stand straight.",
"The house has survived worse than you. Barely.",
"Mind the sword. It remembers me."
],
"rem": {
"s9": {
"lines": [
"Valcor. He guarded my door. I never thanked him. Put that in the book."
],
"syn": "I gave Auberon the page on Sir Valcor's oath. Valcor guarded his door and was never thanked."
},
"s10": {
"lines": [
"The Black Reliquary. We locked it with oaths. Oaths, it turns out, are only as strong as the hand holding the key."
],
"syn": "Auberon says the Reliquary was locked with oaths, and an oath is only as strong as the hand holding the key."
}
}
},
"brannoch": {
"name": "BRANNOCH",
"beats": [
{
"id": "B1",
"rank": 1,
"req": "arrival (`best.stage >= 3`)",
"lines": [
{
"t": "Smith. Brannoch. I made half the steel in this nave. The other half was bad and I'll deny it."
},
{
"t": "Your blades are a disgrace. Not the steel. Nobody sharpens a thing they plan to die with."
},
{
"t": "Bring shards. I bring the hammer. First tier's on the bench."
}
],
"reply": null,
"syn": "A one-armed smith ghost named Brannoch opened the first tier of the armory, crossbow included. He thinks I don't sharpen things."
},
{
"id": "B2",
"rank": 0,
"req": "B1 and `stats.runs >= 3`",
"lines": [
{
"t": "Know what makes a crossbow honest?"
},
{
"t": "Aim, loose, learn. That's the whole craft. Why does nobody believe it?"
}
],
"reply": {
"a": "What?",
"ra": [
"It cannot lie about distance."
],
"b": "Tell me.",
"rb": [
"Every bolt tells the truth at the end of the line."
]
},
"syn": "Brannoch says a crossbow is honest because every bolt tells the truth about distance."
},
{
"id": "B3",
"rank": 0,
"req": "B2 and the Ossuary Colossus felled (`ACH boss_colossus`)",
"lines": [
{
"t": "You broke the Colossus. Look in its chest next time. That ribcage frame is my old sword rack."
},
{
"t": "I built it to hold swords. The dead use it for ribs. Clever. I hate it."
}
],
"reply": null,
"syn": "The Colossus's ribcage is Brannoch's old sword rack. He built it for swords. The dead use it for ribs."
},
{
"id": "B4",
"rank": 2,
"req": "B3 and `best.stage >= 6`",
"lines": [
{
"t": "Stage six. You've met Lady Ferrum, the Iron Maiden. I forged her first blade for the Court, and I carry that."
},
{
"t": "Second tier's yours. Every edge I give you is one she isn't holding."
}
],
"reply": null,
"syn": "Brannoch made Lady Ferrum's first blade for the Court and carries it. He opened the second tier so every edge he gives me is one she isn't holding."
},
{
"id": "B5",
"rank": 0,
"req": "B4",
"lines": [
{
"t": "Tell your hands what they hold. Weight, bite, speed. I'll scratch it on the rack."
},
{
"t": "Appraisal. The armory will tell you a blade's role. Don't say I never gave you anything."
}
],
"reply": null,
"syn": "Brannoch scratches a role onto every blade now: what it's for and how it bites."
},
{
"id": "B6",
"rank": 0,
"req": "B5",
"lines": [
{
"t": "The arm? Lost it holding the forge gate shut the night the Court came. The chain took my hand."
},
{
"t": "Don't pity the arm. Pity the gate. It still stands."
}
],
"reply": null,
"syn": "Brannoch lost his arm holding the forge gate shut the night the Court came. The gate still stands."
},
{
"id": "B7",
"rank": 3,
"req": "B6 and `best.stage >= 8`",
"lines": [
{
"t": "Stage eight. The Hellforge. The kennels were my forge. Cerberax wears my slag and my shackles."
},
{
"t": "Third tier. The big steel. Ruby and the great blade; I only made one of each. I was saving them for someone worth the grief."
}
],
"reply": null,
"syn": "The Hellforge was Brannoch's. He opened the third tier, the big steel he saved for someone worth the grief."
},
{
"id": "B8",
"rank": 4,
"req": "B7 and `stats.wins >= 1`",
"lines": [
{
"t": "The Lich dead and you whole. Now the good part: tell me every swing. I want the story of every swing."
},
{
"t": "I'll put the true numbers on every blade. You've earned the real appraisal."
}
],
"reply": null,
"syn": "Brannoch asked for the story of every swing. He labelled every blade with its true numbers."
},
{
"id": "B9",
"rank": 0,
"req": "Vigil",
"lines": [
{
"t": "The hammer's quiet. First time in four hundred years."
},
{
"t": "I think I'll leave it that way for a night."
}
],
"reply": null,
"syn": "Brannoch set his hammer down. He says he'll leave it quiet for a night."
}
],
"react": {
"EARLY": "Stage {stage}? Check your edge. Check your nerve. In that order.",
"MID": "Stage {stage}. Kit held. Nerve held. Good.",
"LATE": "Stage {stage}. A blade is a promise. You kept it.",
"BOSS": "{by}. Note where it parried and hit heavier there.",
"HAZARD": "The floor? Boots, Baron. Boots are free.",
"NEWBEST": "A new best. Sharpen something.",
"WIN": "I forged for this day. I'd forgotten that."
},
"barks": [
"Sharp is a habit.",
"That whetstone is older than the Order. Don't touch it.",
"Hmph."
],
"rem": {
"s3": {
"lines": [
"The Colossus. Ten thousand and a smithy's worth of ribs. I knew some of them."
],
"syn": "I gave Brannoch the page on the Colossus. He says he knew some of the ten thousand."
},
"s6": {
"lines": [
"Bread and blood. Aye, they knock their jaws. I'd rather it rained."
],
"syn": "Brannoch says the arena's dead knock their jaws and he'd rather it rained."
}
}
},
"cecily": {
"name": "SAINT CECILY",
"beats": [
{
"id": "C1",
"rank": 1,
"req": "arrival (`ACH boss_matriarch`)",
"lines": [
{
"t": "The bell is quieter. You moved her."
},
{
"t": "I am Cecily. I rang the bell the night the Court came. They bound me to it for ringing."
},
{
"t": "Thank you. I can hold a little light now. Take the first of my rites: the Oath that parries and holds."
}
],
"reply": null,
"syn": "The Gargoyle Matriarch sat on the Silent Bell. Freed, the bell-saint Cecily appeared. She rang it the night the Court came and was bound to it for it."
},
{
"id": "C2",
"rank": 0,
"req": "C1",
"lines": [
{
"t": "They call me a saint. I was a bell-founder's apprentice. I only pulled the rope harder than I was told."
}
],
"reply": null,
"syn": "Cecily was a bell-founder's apprentice. She only pulled the rope harder than she was told."
},
{
"id": "C3",
"rank": 0,
"req": "C2",
"lines": [
{
"t": "The bell was cast to ring when the Lich falls. Four hundred years of silence."
},
{
"t": "I am very tired of silence."
}
],
"reply": {
"a": "It will ring.",
"ra": [
"...Say it again? I like it."
],
"b": "What is silence?",
"rb": [
"Ask Ansel. He says it nicer."
]
},
"syn": "The bell was cast to ring the day the Lich falls. Cecily is very tired of silence."
},
{
"id": "C4",
"rank": 0,
"req": "C3 and `best.stage >= 6`",
"lines": [
{
"t": "Hold still. Hear that? Not the bell. Underneath."
},
{
"t": "Everything down there hums on one note. It isn't music. It's the opposite of music. Don't answer it."
}
],
"reply": null,
"syn": "Cecily hears one note under everything below. She says it's the opposite of music. I'm not to answer it."
},
{
"id": "C5",
"rank": 2,
"req": "C4 and `stats.wins >= 1`",
"lines": [
{
"t": "I rang it. Can you hear? For the first time in four hundred years. It's the right note!"
},
{
"t": "Take the Halo. It was made to be broken for someone. I'd like it to be you."
}
],
"reply": null,
"syn": "The Lich fell and Cecily rang the bell for the first time in four hundred years. She gave me the Halo."
},
{
"id": "C6",
"rank": 0,
"req": "C5",
"lines": [
{
"t": "Ulric. The Hollow Saint. He was my confessor. He prayed into the quiet until it answered."
},
{
"t": "I should have pulled him out by the hem. I was ringing a bell. It seemed more important at the time."
}
],
"reply": null,
"syn": "The Hollow Saint was Cecily's confessor, Ulric. He prayed into the quiet until it answered."
},
{
"id": "C7",
"rank": 0,
"req": "C6",
"lines": [
{
"t": "Do you know people call me patient? I'm not. I simply can't leave the bell."
},
{
"t": "But the bell is quiet and I can see the stair. That is new. I'm trying not to hope loudly."
}
],
"reply": null,
"syn": "Cecily says she isn't patient, she just can't leave the bell. Now the bell is quiet and she can see the stair."
},
{
"id": "C8",
"rank": 3,
"req": "C7 and (the Hollow Saint destroyed, `ACH saint`) or `stats.wins >= 3`",
"lines": [
{
"t": "Last rites. I never learned the proper words. I wrote my own."
},
{
"t": "They're only a hope in a very small bell. Take them in anyway."
}
],
"reply": null,
"syn": "Cecily wrote her own last rites because she never learned the real ones. A hope in a small bell. I took it anyway."
},
{
"id": "C9",
"rank": 0,
"req": "Vigil",
"lines": [
{
"t": "I'd like to ring it for you, if you don't mind. Not for the Lich. For you."
}
],
"reply": null,
"syn": "Cecily rang the bell for me. Not for the Lich. For me."
}
],
"react": {
"EARLY": "Stage {stage}. You fall and you rise. That's a holy thing, you know.",
"MID": "Stage {stage}. Quietly done.",
"BOSS": "{by}. Say a word for it before you hit it next time.",
"HAZARD": "The floor. Gravity is a very old rite.",
"NEWBEST": "Farther down. The note gets louder.",
"WIN": "I... heard it from here. Thank you.",
"ABYSS": "Depth {abyss}. Louder, isn't it? The note."
},
"barks": [
"(the bell hums)",
"Mind the draught. It carries."
],
"rem": {
"s5": {
"lines": [
"The Silent Bell. If you've read it, you know I'm to ring it. Hold me to that."
],
"syn": "I gave Cecily the page on the Silent Bell. She asked me to hold her to ringing it."
},
"saint": {
"lines": [
"Ulric's page. Thank you for remembering him."
],
"syn": "Cecily thanked me for remembering the Hollow Saint."
}
}
},
"isolde": {
"name": "ISOLDE VANE",
"beats": [
{
"id": "I1",
"rank": 1,
"req": "arrival (`ACH boss_witch`)",
"lines": [
{
"t": "She's gone. Really gone. I... you're staring. I'm Isolde. Morwen's apprentice. I wrote every name in her Ledger."
},
{
"t": "I'll sell you what I can. It's the least I owe. It isn't the least. It's the first instalment."
}
],
"reply": null,
"syn": "Isolde was Morwen's apprentice and wrote every name in her Ledger. She sells occult relics as the first instalment of what she owes."
},
{
"id": "I2",
"rank": 0,
"req": "I1",
"lines": [
{
"t": "I cut my hair the night I understood. Penance. It looks dreadful, you may say so."
}
],
"reply": {
"a": "It's fine.",
"ra": [
"Thank you. That was kind and entirely false."
],
"b": "It's dreadful.",
"rb": [
"Thank you. Honest. Rare."
]
},
"syn": "Isolde cut her hair as penance. She asked me to be honest about it. I was."
},
{
"id": "I3",
"rank": 0,
"req": "I2",
"lines": [
{
"t": "Morwen was kind to me. That's what I can't forgive. She was kind, and she was drowning people."
}
],
"reply": null,
"syn": "Isolde can't forgive that Morwen was kind to her while drowning other people."
},
{
"id": "I4",
"rank": 0,
"req": "I3 and `best.stage >= 8`",
"lines": [
{
"t": "I've been avoiding this. Your page in the Ledger. Every name has a price. Beside yours she wrote 'not for sale.' You know that line."
},
{
"t": "There is a second line under it, in her old hand. 'Paid in advance. See: the vault.'"
}
],
"reply": {
"a": "I know now.",
"ra": [
"I'm so sorry, Baron. You opened it yourself."
],
"b": "Say it again.",
"rb": [
"'See: the vault.' You opened it yourself, Baron. I'm so sorry."
]
},
"syn": "Morwen's Ledger had a second line under mine: \"Paid in advance. See: the vault.\" I opened the Reliquary vault myself."
},
{
"id": "I5",
"rank": 0,
"req": "I4",
"lines": [
{
"t": "The Court never took the Reliquary. It was handed over. By the first knight. Who then burned his own banner."
},
{
"t": "She was furious. She wrote that part in red."
}
],
"reply": null,
"syn": "Morwen was furious that I burned the banner. She wrote that part in red."
},
{
"id": "I6",
"rank": 0,
"req": "I5",
"lines": [
{
"t": "I'm unmaking some of what she made. I started with the soul-shards. They don't eat what they take any more."
},
{
"t": "The dead down there aren't evil. They forgot. That's all it is. Forgetting. I'm trying to remember them."
}
],
"reply": null,
"syn": "Isolde says the dead below aren't evil. They forgot they were dead. She is trying to remember them."
},
{
"id": "I7",
"rank": 2,
"req": "I6 and `stats.wins >= 1`",
"lines": [
{
"t": "The Lich's Ring. I studied the crown for four hundred years from a distance. Now it's broken. The ring is only a ring. It's yours."
}
],
"reply": null,
"syn": "Isolde opened the Lich King's Ring to me now that it's only a ring."
},
{
"id": "I8",
"rank": 0,
"req": "I7",
"lines": [
{
"t": "'He promised I'd never die.' I heard it from here. Tell me. Did she believe it, to the end?"
}
],
"reply": {
"a": "She did.",
"ra": [
"Then she died hopeful. That's something."
],
"b": "I don't know.",
"rb": [
"No. Of course you don't. Thank you for not lying."
]
},
"syn": "Isolde asked if Morwen believed his promise to the end. I told her what I could. She said that was something."
},
{
"id": "I9",
"rank": 0,
"req": "Vigil",
"lines": [
{
"t": "I burned the Ledger. Page by page. Yours last. Beside your name it says 'paid.' I kept that one, and nothing else."
}
],
"reply": null,
"syn": "Isolde burned the Ledger page by page. Mine she kept, with one word beside my name: paid."
}
],
"react": {
"EARLY": "Stage {stage}. Everyone starts somewhere. I started at the wrong end.",
"MID": "Stage {stage}. You're learning her tells without me.",
"LATE": "Stage {stage}. Be careful. The Ledger gets nastier near the bottom.",
"BOSS": "{by}. I've seen it on a page. It was cheap. It didn't die cheap.",
"HAZARD": "The floor? Someone should apologise to the floor.",
"WIN": "...you did it. I'm sorry. I'm happy. Both.",
"ABYSS": "Depth {abyss}. There's no page for that. Isn't that lovely?"
},
"barks": [
"Don't read the margin.",
"Sorry. Habit.",
"I'd offer tea. I have no hands that work."
],
"rem": {
"s7": {
"lines": [
"My handwriting. Don't read the margin. ...Oh. You've read the margin."
],
"syn": "I gave Isolde the Ledger page. Her handwriting. She asked me not to read the margin. I'd already read it."
},
"m13_sigil": {
"lines": [
"The banner was stitched with grave thread. I stitched the third seal. I'm sorry."
],
"syn": "Isolde stitched the third Ashen Sigil into the Court's banner with grave thread."
}
}
},
"ansel": {
"name": "ANSEL",
"beats": [
{
"id": "N1",
"rank": 1,
"req": "arrival (3 secret rooms found, or 6 runs, or the Pilgrim's candle)",
"lines": [
{
"t": "Hello. You're the one with the sword. I'm Ansel. I'm dead. It's all right. It was a long time ago."
},
{
"t": "I can tell you how many secret rooms a place has. I can't tell you where. That would be cheating."
}
],
"reply": null,
"syn": "A dead boy named Ansel can tell me how many secret rooms a stage hides. Not where. That would be cheating."
},
{
"id": "N2",
"rank": 0,
"req": "N1",
"lines": [
{
"t": "Mama lit a candle for me. She got lost, didn't she. I can feel it. It's far but it's still warm."
},
{
"t": "...She isn't lost now. Thank you for finding it.",
"if": "if you found her candle"
}
],
"reply": null,
"syn": "Ansel's mother lit a candle for him and got lost looking for the way out. He can feel it's still warm."
},
{
"id": "N3",
"rank": 0,
"req": "N2",
"lines": [
{
"t": "This is Barley. He's a horse. He's very brave."
}
],
"reply": {
"a": "Hello, Barley.",
"ra": [
"Barley says hello. He likes your boots."
],
"b": "Is he real?",
"rb": [
"He's wood. That's not the same as not real."
]
},
"syn": "Ansel has a wooden horse called Barley. Barley is very brave. I said hello to him."
},
{
"id": "N4",
"rank": 2,
"req": "N3 and (`stats.secrets >= 8` or `best.stage >= 6`)",
"lines": [
{
"t": "Some places have stones that hum. Now I can tell if a Sigil is hiding. It feels like a cold spot in a warm bath."
}
],
"reply": null,
"syn": "Ansel can now tell me if a stage hides an Ashen Sigil. It's like a cold spot in a warm bath."
},
{
"id": "N5",
"rank": 0,
"req": "N4",
"lines": [
{
"t": "Do you hear the quiet under things, Kael?"
},
{
"t": "It isn't empty. It's patient."
}
],
"reply": null,
"syn": "Ansel says the quiet under everything isn't empty. It's patient."
},
{
"id": "N6",
"rank": 0,
"req": "N5 + Auberon A4",
"lines": [
{
"t": "The god left. When it left, there was a space the shape of it. The Silence is just that space, getting bigger."
},
{
"t": "It eats light first. Then names. Then you forget what a name was."
},
{
"t": "It can't eat you. You make too much noise."
}
],
"reply": null,
"syn": "The Silence is the space the god left, growing. It eats light, then names, then the memory of what a name was. Ansel says it can't eat me. I make too much noise."
},
{
"id": "N7",
"rank": 3,
"req": "N6 and `best.stage >= 8`",
"lines": [
{
"t": "Every place has an upstairs and a downstairs. Each one keeps an old page. I can tell you which floor now."
}
],
"reply": null,
"syn": "Ansel can tell me which floor of a stage hides its old page: upper, ground or lower."
},
{
"id": "N8",
"rank": 0,
"req": "N7 and `stats.wins >= 1`",
"lines": [
{
"t": "You pulled out the cork, not the bottle. The Abyss is the bottle."
}
],
"reply": null,
"syn": "Ansel says I killed the cork, not the bottle. The Abyss is the bottle."
},
{
"id": "N9",
"rank": 0,
"req": "Vigil",
"lines": [
{
"t": "Mama's by the door. She looks tired, and she's smiling. Can you see her? ...No. That's all right. I'll tell you if she says anything."
},
{
"t": "Mama's coming. I can feel the candle getting closer.",
"if": "if her candle was never found"
}
],
"reply": null,
"syn": "Ansel says his mother is by the door, smiling. I couldn't see her. He promised to tell me if she says anything."
}
],
"react": {
"EARLY": "You died fast. It's all right. I did too.",
"MID": "Stage {stage}. It's loud there.",
"LATE": "Stage {stage}. It's very loud there.",
"BOSS": "{by} was lonely. They always are.",
"HAZARD": "Falling's quick. It's the landing that's rude.",
"WIN": "Everything went quiet and then it went loud, in the good way.",
"ABYSS": "Depth {abyss}. It listens. Be rude to it."
},
"barks": [
"Barley says you smell like smoke.",
"Do you want to see my drawing? It's of a door.",
"I'm not scared. Barley is. I'm taking care of him."
],
"rem": {
"m13_pilgrim": {
"lines": [
"That's Mama's candle! You found it? Thank you for not blowing it out."
],
"syn": "I gave Ansel the page on the Lost Pilgrim. It was his mother's candle. He thanked me for not blowing it out."
},
"s4": {
"lines": [
"The moon turned red. It was sad, not angry. People mix those up."
],
"syn": "Ansel says the blood moon was sad, not angry. People mix those up."
}
}
},
"ozmeth": {
"name": "OZMETH",
"beats": [
{
"id": "O1",
"rank": 1,
"req": "arrival (`ACH boss_cerberax`)",
"lines": [
{
"t": "Well, well, well. The famous Baron, and me in a cage. Ozmeth, Debtor of the Third Circle. Currently held for unpaid rent."
},
{
"t": "Cerberax's chain held mine. He's gone, the chain's slack, and I'm sure that's a coincidence. I'm sure you'd like to buy something."
},
{
"t": "Infernal goods. The fine print is for the weak."
}
],
"reply": null,
"syn": "A caged demon called Ozmeth sells infernal relics. He says his chain slackened when Cerberax died. He grinned when he said it."
},
{
"id": "O2",
"rank": 0,
"req": "O1",
"lines": [
{
"t": "I'm contractually unable to lie. Not unable to mislead."
}
],
"reply": null,
"syn": "Ozmeth can't lie. He can mislead. I'm keeping the difference in mind."
},
{
"id": "O3",
"rank": 0,
"req": "O2",
"lines": [
{
"t": "Your little Chapel is on a payment plan, did you know? The candle. The Oath. Somebody is always owed."
}
],
"reply": {
"a": "Who?",
"ra": [
"Ask the boy. He reads the books upside down."
],
"b": "Spare me.",
"rb": [
"Mm. Free advice. You'll pay for that."
]
},
"syn": "Ozmeth says the Chapel and its candle are on a payment plan. Someone is always owed."
},
{
"id": "O4",
"rank": 0,
"req": "O3",
"lines": [
{
"t": "I'm from hell, Baron. Do you know the one thing hell and heaven agree on? We both hate the quiet."
},
{
"t": "At least down there the screaming has rhythm."
}
],
"reply": null,
"syn": "Ozmeth says hell and heaven agree on one thing: they hate the quiet."
},
{
"id": "O5",
"rank": 2,
"req": "O4 and (`best.stage >= 9` or `stats.wins >= 1`)",
"lines": [
{
"t": "Emberbrand. I know that blade. It burns because it can't stop remembering. Start your runs with it, if you can find it."
}
],
"reply": null,
"syn": "Ozmeth opened Emberbrand as a starting weapon. He says it burns because it can't stop remembering."
},
{
"id": "O6",
"rank": 0,
"req": "O5",
"lines": [
{
"t": "Osric didn't make the bargain to rule. He made it to stop the Silence. He thought a crown could hold it. He was wrong. He was also early."
}
],
"reply": null,
"syn": "Ozmeth says Osric tried to stop the Silence with a crown and was wrong, but early."
},
{
"id": "O7",
"rank": 0,
"req": "O6",
"lines": [
{
"t": "I don't take the Silence's deals. Everything I do has a price, a term and a receipt. Its deals have no receipts."
}
],
"reply": null,
"syn": "Ozmeth won't take the Silence's deals. Its deals have no receipts."
},
{
"id": "O8",
"rank": 0,
"req": "O7 and `stats.wins >= 1`",
"lines": [
{
"t": "You're going down there, aren't you? When you do, take me out on the way. I'll make it worth your while. Naturally."
}
],
"reply": null,
"syn": "Ozmeth wants me to take him out of the Hellforge on my way into the Abyss. He says he'll make it worth my while."
},
{
"id": "O9",
"rank": 0,
"req": "Vigil",
"lines": [
{
"t": "Free? Hm. I haven't the faintest idea what a demon does when it's free. More debts, probably. But *my* debts."
}
],
"reply": null,
"syn": "The chain fell off Ozmeth. He says he'll go on making debts, but they'll be his."
}
],
"react": {
"EARLY": "Stage {stage}? A bargain death. Charming.",
"MID": "Stage {stage}. Respectable. Like a bad contract.",
"LATE": "Stage {stage}. Almost. I love almost.",
"BOSS": "{by}. Sloppy. I wouldn't have dropped a soul to it.",
"HAZARD": "Death by floor. Even I call that embarrassing.",
"WIN": "You WON? I'll pretend I'm not impressed. I'm very good at it.",
"ABYSS": "Depth {abyss}. My old neighbourhood. Mind the rent."
},
"barks": [
"Take a card. I have none.",
"Everything's negotiable except the Silence.",
"Quiet in here. I hate it. Say something."
],
"rem": {
"s8": {
"lines": [
"The Hellforge. My old address. The queen's dog was an adorable puppy and a terrible judge of queens."
],
"syn": "I gave Ozmeth the page on the Hellforge. He says Cerberax was an adorable puppy and a terrible judge of queens."
},
"m13_gilded": {
"lines": [
"The Gilded Dead! Oh, he owed me. He still does. Death is no excuse."
],
"syn": "Ozmeth says the Gilded Dead still owes him. Death is no excuse."
}
}
},
"baron": {
"name": "THE BLACK BARON",
"beats": [
{
"id": "K1",
"rank": 0,
"req": "arrival (defeat him in the Black Chapel)",
"lines": [
{
"t": "I'm not bound. I thought I would be."
},
{
"t": "You won. Don't say it. I know. You took me back."
},
{
"t": "I'm what you left. I'll stay. For a while."
}
],
"reply": null,
"syn": "I beat the Black Baron. He didn't die. He knelt in the Chapel and says he'll stay a while."
},
{
"id": "K2",
"rank": 0,
"req": "K1",
"lines": [
{
"t": "You left me with the banner. You knew it wouldn't burn."
}
],
"reply": {
"a": "I left you a chance.",
"ra": [
"A chance. Hm."
],
"b": "I left you to hate me.",
"rb": [
"I tried. I'm bad at it."
]
},
"syn": "The Baron says I left him with the banner knowing it wouldn't burn."
},
{
"id": "K3",
"rank": 0,
"req": "K2",
"lines": [
{
"t": "I served him gladly. Don't pretend I didn't. The first oath felt like being held."
}
],
"reply": null,
"syn": "The Baron says his oath to Osric felt like being held. I can't call him a liar."
},
{
"id": "K4",
"rank": 0,
"req": "K3",
"lines": [
{
"t": "I don't hate you. I envy you. You were always the one who could be sorry."
}
],
"reply": null,
"syn": "The Baron says he doesn't hate me. He envies me. I was always the one who could be sorry."
},
{
"id": "K5",
"rank": 0,
"req": "K4",
"lines": [
{
"t": "The Court. Do you remember their names? ...I do. Every one. I carry them."
}
],
"reply": null,
"syn": "The Baron carries the name of every knight of the Black Court. I don't."
},
{
"id": "K6",
"rank": 0,
"req": "K5 + Isolde I5",
"lines": [
{
"t": "Do you want some of it back? The banner night. I kept it for you."
},
{
"t": "You burned it because you saw yourself in the black. That is the night you split. I took the oath. You took the guilt."
}
],
"reply": null,
"syn": "I saw myself in the black and burned the banner. That's the night I split: the Baron took the oath and I took the guilt."
},
{
"id": "K7",
"rank": 0,
"req": "K6",
"lines": [
{
"t": "I've started to remember gold. A little, at the edges of the plate."
}
],
"reply": null,
"syn": "Gold is coming back to the Baron's armour, a thread at a time."
},
{
"id": "K8",
"rank": 0,
"req": "Vigil. The Baron stands and holds out the unburned black banner.",
"lines": [
{
"t": "I'm tired of kneeling. Take it or burn it. I'll abide."
}
],
"reply": {
"a": "Keep it.",
"ra": [
"Then it hangs where we can both see it."
],
"b": "Burn it.",
"rb": [
"Then let it burn. I'll watch."
],
"sa": "The Baron stood and handed me the black banner. I kept it. It hangs in the Chapel where we can both see it.",
"sb": "The Baron stood and handed me the black banner. I burned it. He watched until it was ash."
},
"syn": "The Baron stood and handed me the black banner. I kept it. It hangs in the Chapel where we can both see it.",
"sets": "Sets `flags.banner = 'keep' | 'burn'`: the hub shows either the banner on the west wall prop or a small ash mark."
}
],
"react": {
"EARLY": "Stage {stage}. You always started well.",
"MID": "Stage {stage}. Sound footwork.",
"LATE": "Stage {stage}. Don't swing early at {by}. I would have.",
"BOSS": "{by}. I know that guard. Break it.",
"WIN/ABYSS": "Depth {abyss}. You're going where I couldn't."
},
"barks": [
"(silence; he does not look up)",
"The banner is heavier when no one is holding it."
],
"rem": {
"m13_baron": {
"lines": [
"That page. They wrote me kindly. I had forgotten kindness was possible."
],
"syn": "I gave the Baron the page about himself. He says it was kind. He had forgotten kindness was possible."
},
"m13_reliq": {
"lines": [
"The walled-up monks. I watched them be walled. I said nothing. I was the Court."
],
"syn": "The Baron watched the monks being walled up and said nothing. He says he was the Court."
}
}
}
};
