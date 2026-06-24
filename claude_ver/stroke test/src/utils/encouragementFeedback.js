const DEFAULT_WORLD_ID = 'wood';

const WORLD_ENCOURAGEMENT = {
  wood: {
    idlePrompt: '木工師傅看著你，準備把下一筆敲穩。',
    progressTemplate: '木框又穩住一節。',
    mood: 'spark',
    instantPraises: [
      '敲得真準！',
      '這一下很穩！',
      '木框成形了！',
      '師傅點頭了！',
    ],
    wordComplete: [
      {
        headline: '木作完成！',
        subline: '這塊木框已經鎖好，準備接下一件。',
      },
      {
        headline: '工坊又有收成！',
        subline: '你的手勢很穩，木部作品順利落定。',
      },
    ],
    levelCeremony: [
      {
        title: '木部工坊大功告成！',
        subtitle: '小木匠把骨架敲得結結實實。',
      },
      {
        title: '工坊掌聲響起！',
        subtitle: '這頂冠帽的骨架，已經由你親手完成。',
      },
    ],
    rewardLabel: '榫接木扣',
    rewardSummary: '木部工坊材料已收入冠帽木框。',
    rewardAccent: '工坊收成',
  },
  grain: {
    idlePrompt: '田園夥伴在等你，把下一筆收進節奏裡。',
    progressTemplate: '稻穗又垂下一束。',
    mood: 'grow',
    instantPraises: [
      '收得真順！',
      '穗浪跟上了！',
      '這筆好有節奏！',
      '田園為你鼓掌！',
    ],
    wordComplete: [
      {
        headline: '穗飾編好了！',
        subline: '金穗搖一搖，新的作品已經入籃。',
      },
      {
        headline: '田園又豐收了！',
        subline: '你把每一筆都收得又穩又亮。',
      },
    ],
    levelCeremony: [
      {
        title: '禾部田園大豐收！',
        subtitle: '你的節奏讓冠帽穗飾一束束完成。',
      },
      {
        title: '田園慶功開始！',
        subtitle: '這一關的穗飾，已經由你親手編好。',
      },
    ],
    rewardLabel: '冠帽穗飾',
    rewardSummary: '禾部田園材料已收入冠帽垂掛穗飾。',
    rewardAccent: '田園收成',
  },
  fire: {
    idlePrompt: '廚房夥伴正看著火候，等你落下下一筆。',
    progressTemplate: '火紋又亮起一段。',
    mood: 'flare',
    instantPraises: [
      '火候剛剛好！',
      '這筆真俐落！',
      '金飾亮起來了！',
      '廚房喝采中！',
    ],
    wordComplete: [
      {
        headline: '火紋鍛亮了！',
        subline: '這道工序順順完成，金飾正發著光。',
      },
      {
        headline: '鍋鏟翻出成果！',
        subline: '你把火部節奏掌握得真好。',
      },
    ],
    levelCeremony: [
      {
        title: '火部廚房熱烈慶功！',
        subtitle: '中央金飾已經被你鍛得亮晶晶。',
      },
      {
        title: '廚房明星就是你！',
        subtitle: '這一關的火紋徽印，已經完成上桌。',
      },
    ],
    rewardLabel: '中央金飾',
    rewardSummary: '火部廚房材料已收入冠帽中央徽印。',
    rewardAccent: '廚房出鍋',
  },
  speech: {
    idlePrompt: '書院學伴在等你，把下一筆寫得更有神氣。',
    progressTemplate: '墨痕又添上一分書卷氣。',
    mood: 'ink',
    instantPraises: [
      '這筆真有神！',
      '墨氣漂亮極了！',
      '書卷氣出來了！',
      '書生正在喝采！',
    ],
    wordComplete: [
      {
        headline: '冠牌落定了！',
        subline: '這一筆一氣呵成，題字終於完整亮相。',
      },
      {
        headline: '墨題寫成了！',
        subline: '你的筆勢很穩，書院都在點頭。',
      },
    ],
    levelCeremony: [
      {
        title: '言部書院傳來掌聲！',
        subtitle: '這塊題字冠牌，已經由你親手寫成。',
      },
      {
        title: '書院小狀元就是你！',
        subtitle: '墨題匾額已經穩穩收入冠帽正面。',
      },
    ],
    rewardLabel: '墨題匾額',
    rewardSummary: '言部書院材料已收入冠帽正面題字冠牌。',
    rewardAccent: '書院收卷',
  },
};

function getWorldPack(worldId) {
  return WORLD_ENCOURAGEMENT[worldId] || WORLD_ENCOURAGEMENT[DEFAULT_WORLD_ID];
}

function pickFromList(list, stamp = 0) {
  if (!Array.isArray(list) || list.length === 0) return null;
  return list[Math.abs(stamp) % list.length];
}

export function getEncouragementPack(worldId) {
  return getWorldPack(worldId);
}

export function pickInstantPraise(worldId, stamp = 0) {
  const pack = getWorldPack(worldId);
  return pickFromList(pack.instantPraises, stamp) || '這一筆真棒！';
}

export function pickWordCompletePraise(worldId, stamp = 0) {
  const pack = getWorldPack(worldId);
  return (
    pickFromList(pack.wordComplete, stamp) || {
      headline: '作品完成了！',
      subline: '這個作品順利落定，準備下一個挑戰。',
    }
  );
}

export function pickLevelCeremonyPraise(worldId, stamp = 0) {
  const pack = getWorldPack(worldId);
  return (
    pickFromList(pack.levelCeremony, stamp) || {
      title: '通關成功！',
      subtitle: '新的作品已經穩穩收入收藏。',
    }
  );
}
