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
        title: '木部工坊試煉完成！',
        subtitle: '你替狀元帽打好了穩穩的木框骨架。',
      },
      {
        title: '工坊配件掉落！',
        subtitle: '木框骨架配件已由你親手完成並收入收藏。',
      },
    ],
    rewardLabel: '榫接木扣',
    rewardSummary: '木部工坊掉落的配件已收入狀元帽木框，徽章也一併保留。',
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
        title: '禾部田園試煉完成！',
        subtitle: '你把狀元帽需要的穗飾一束束編好了。',
      },
      {
        title: '田園配件掉落！',
        subtitle: '穗飾配件已由你親手完成並收入收藏。',
      },
    ],
    rewardLabel: '冠帽穗飾',
    rewardSummary: '禾部田園掉落的配件已收入狀元帽垂掛穗飾，徽章也一併保留。',
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
        title: '火部廚房試煉完成！',
        subtitle: '你把狀元帽中央的亮眼配件鍛得閃閃發光。',
      },
      {
        title: '廚房配件掉落！',
        subtitle: '中央金飾配件已由你親手完成並收入收藏。',
      },
    ],
    rewardLabel: '中央金飾',
    rewardSummary: '火部廚房掉落的配件已收入狀元帽中央徽印，徽章也一併保留。',
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
        title: '言部書院試煉完成！',
        subtitle: '你親手寫好了狀元帽最重要的題字冠牌。',
      },
      {
        title: '書院配件掉落！',
        subtitle: '墨題匾額配件已由你親手完成並收入收藏。',
      },
    ],
    rewardLabel: '墨題匾額',
    rewardSummary: '言部書院掉落的配件已收入狀元帽正面題字冠牌，徽章也一併保留。',
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
      title: '試煉完成！',
      subtitle: '新的狀元帽配件已穩穩收入收藏。',
    }
  );
}
