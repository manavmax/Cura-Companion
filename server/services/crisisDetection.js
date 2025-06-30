const crisisPhrases = [
  "i don't want to live anymore",
  "i wish i were dead",
  "there's no way out",
  "everyone would be better off without me",
  "i'm tired of everything",
  "i just want the pain to stop",
  "i'm done",
  "i can't do this anymore",
  "i want to disappear forever",
  "it's not worth living anymore",
  "tonight is the night",
  "i bought pills",
  "i bought rope",
  "i bought blade",
  "i'll end it all",
  "death is the only escape",
  "this is my last message",
  "i'm saying goodbye",
  "see you on the other side",
  "no one can save me now",
  "i feel like i'm fading",
  "i just want to sleep forever",
  "i'm done fighting",
  "nothing matters anymore",
  "i wish i could vanish",
  "there's no light at the end of the tunnel",
  "i'm tired in a way sleep can't fix",
  "i'm empty",
  "i feel dead inside",
  "the world would be better off without me",
  "silence is the only peace i get",
  "i'm drowning but nobody sees",
  "i feel like a ghost in my own life",
  "i cut myself again",
  "pain makes me feel alive",
  "the blade understands me",
  "i don't care anymore",
  "i can't stop crying",
  "i feel numb",
  "i hate myself",
  "i'm breaking apart",
  "it hurts too much",
  "i can't take it anymore",
  "unaliving myself",
  "forever sleep",
  "taking the long nap",
  "reaching the void",
  "clocking out",
  "dark place",
  "falling into the abyss",
  "exiting the simulation",
  "joining the stars",
  "my demons are winning",
  "i want to die",
  "i want to kill myself",
  "i want to end it all",
  "i want to commit suicide",
  "i want to hurt myself",
  "i want to disappear",
  "i want to give up"
];

function normalize(text) {
  return (text || "").toLowerCase().replace(/[^a-z0-9\s]/gi, "");
}

function containsCrisisPhrase(text) {
  const norm = normalize(text);
  return crisisPhrases.some(phrase => norm.includes(phrase));
}

function detectCrisis({ mood, anxiety, note, content, messages }) {
  let crisisSignals = [];
  // Mood thresholds
  if (typeof mood === 'number' && mood <= 2) {
    crisisSignals.push("Very low mood");
  }
  if (typeof anxiety === 'number' && anxiety >= 8) {
    crisisSignals.push("Very high anxiety");
  }
  // Note or content
  if (note && containsCrisisPhrase(note)) {
    crisisSignals.push("Crisis phrase in mood note");
  }
  if (content && containsCrisisPhrase(content)) {
    crisisSignals.push("Crisis phrase in journal/chat");
  }
  // Messages (for chat sessions)
  if (Array.isArray(messages)) {
    for (const msg of messages) {
      if (msg.content && containsCrisisPhrase(msg.content)) {
        crisisSignals.push("Crisis phrase in chat message");
        break;
      }
    }
  }
  // If any crisis signal found, return crisis detected
  if (crisisSignals.length > 0) {
    return {
      crisis: true,
      summary: crisisSignals.join('; ')
    };
  }
  return { crisis: false };
}

module.exports = { detectCrisis }; 