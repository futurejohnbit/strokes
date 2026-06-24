# Task 1 Research Notes

日期: 2026-06-22

## 現況對齊
- 現有首頁實作已是 React + Vite + Tailwind，並且已使用 GSAP；因此後續方案應優先選擇「可拆成單頁 section、可逐步移植、動畫可降級」的參考，而不是依賴大型 Next.js 路由或複雜內容系統。
- 目前 `HomePreviewV2.jsx` 明顯偏向多段介紹頁與較多展示模組，不適合原樣保留；Task 1 的研究結論應服務於「縮回單一 landing page」而不是再加更多內容。

## GitHub 研究結論

### 可直接採用方向
1. `launch-ui/launch-ui`
   - 適合直接借用: hero 排版骨架、CTA 區塊、簡潔 navbar / section spacing、可複製貼上的 React + Tailwind 元件拆分方式。
   - 可直接採用原因: repo 明確標示 MIT license，且定位就是 landing page kit，可 copy/paste 到現有專案再改文案與視覺。
   - 使用限制: MIT 允許改作與商用，但仍應保留授權檔與原始版權聲明，不建議連同品牌文案或示意素材原封不動搬入。

2. `GetNextjsTemplates/si-educational-nextjs`
   - 適合直接借用: 教育首頁的資訊排序思路，例如標題、簡述、價值點、按鈕、少量補充區塊。
   - 可直接採用原因: repo 頁面標示 MIT license，主題本身就是 education landing page，與本案「面向學生的展示首頁」更接近。
   - 使用限制: 技術棧偏 Next.js，但可只借用版型結構與內容節奏，不必照搬其專案結構。

3. `fabianofforte/Landing-Page-React-Tailwind-CSS`
   - 適合直接借用: React + Vite + Tailwind 的基礎 landing page 組織方式，尤其適合拿來比對如何把頁面壓回單頁。
   - 可直接採用原因: 與現有專案技術棧相近，移植成本低。
   - 使用限制: 需先再次確認 repo 內是否含清楚授權檔；若最終未確認 LICENSE，則只建議借結構，不直接複製程式碼。

### 僅適合作為設計靈感
1. `gumrahsindar/skilled-e-learning-landing-page`
   - 可參考點: 教育產品首頁常見的輕量 hero、卡片式價值點、乾淨視覺節奏。
   - 不建議直接複製原因: repo 頁面未明確看到授權資訊，授權不清時不應直接搬用程式碼。

2. `namodynamic/gsap-cocktail-landing-pg`
   - 可參考點: hero 的入場動畫、少量 GSAP timeline 組織方式。
   - 不建議直接複製原因: 題材與本案差距大，且動畫密度偏高，容易再次偏離「資訊清晰、避免花巧」的需求。

3. `adrianhajdin/jsm_gta_vi_landing` 等重動畫案例
   - 可參考點: ScrollTrigger 組織手法、段落進場時機。
   - 不建議直接複製原因: 屬於強敘事、強視覺、重影片素材的 cinematic landing page，與本案展示型教育首頁不匹配，過度採用會造成實作膨脹。

## 對本案可直接採用的首頁方向
1. 單一 landing page，首屏只保留一個 hero。
2. Hero 只保留四個核心元素: 主標題、1 句故事、3 步流程、2 個主要按鈕。
3. 動畫降到最低:
   - 首屏只保留一次性的文字/卡片淡入。
   - 區塊進場只做輕微位移與透明度變化。
   - 不做長段 pinned scroll、影片綁捲動、複雜 parallax。
4. 教育感來源放在文案與插圖，而不是大量區塊:
   - 用「四大職業收集材料，最後合成狀元冠帽」做一句故事。
   - 用 3 步卡片講玩法，不展開完整介紹頁。
5. 保留 React component 化，但 section 數量控制在 3 到 4 個:
   - Hero
   - 故事 / 流程
   - 主要按鈕與音樂開關
   - 可選的素材致謝 / 授權說明

## 免費音樂庫研究結論

### 優先推薦
1. Pixabay Music
   - 適合原因: 可免費使用、可修改、通常不需署名，最適合展覽頁面與一般網站背景音樂。
   - 主要限制:
     - 不可把音樂原封不動當成獨立商品重新販售或分發。
     - 若素材含可識別商標、品牌，商業用途要額外小心。
     - 仍需自行確認是否存在第三方權利。

2. Mixkit Music
   - 適合原因: 免費、免署名、可用於商業與非商業專案，且下載流程簡單。
   - 主要限制:
     - 不可把素材原樣轉售、再授權或單獨分發。
     - 若將素材放進可販售產品中，需加入明顯的人為加工與其他內容，不能讓音樂本身成為主要交付物。

### 可用但需更嚴格檢查
1. Incompetech
   - 適合原因: 曲庫經典，若可接受署名，免費門檻低。
   - 主要限制:
     - 免費方案走 Creative Commons，必須署名。
     - 若不方便署名，需購買 Standard License。

2. Free Music Archive
   - 適合原因: 題材多、可找到較有個性的背景音樂。
   - 主要限制:
     - 授權依單曲而異，常見為不同種 Creative Commons。
     - 不是所有曲目都可商用，也不是所有曲目都可改作。
     - 若時程緊，不適合作為第一優先來源。

## 建議最終採用
- 首選音樂來源: Pixabay Music。
- 備選音樂來源: Mixkit Music。
- 不建議第一輪就選: Free Music Archive，因為每首歌都要逐首核對授權，管理成本較高。
- 若需要較童趣、短循環、低存在感背景音樂，優先選 60 到 120 秒、節奏穩定、無人聲、可無縫循環的曲目。

## 實作前授權檢查清單
- 保留最終採用音軌的來源網址與下載日期。
- 截圖保存授權頁或下載頁，避免日後條款更新難以追溯。
- 避免使用帶強烈品牌辨識、歌詞人聲或明顯情緒反差過大的曲目。
- 若採用需署名音樂，應在首頁頁尾或展覽說明中補上 credit。

## 來源
- GitHub: https://github.com/launch-ui/launch-ui
- GitHub: https://github.com/GetNextjsTemplates/si-educational-nextjs
- GitHub: https://github.com/gumrahsindar/skilled-e-learning-landing-page
- GitHub: https://github.com/namodynamic/gsap-cocktail-landing-pg
- GitHub: https://github.com/adrianhajdin/jsm_gta_vi_landing
- Pixabay license summary: https://pixabay.com/service/license-summary/
- Mixkit license: https://mixkit.co/license/
- Mixkit music page: https://mixkit.co/free-stock-music/
- Incompetech licenses: https://incompetech.com/music/royalty-free/licenses/
- Reference index for music-library comparison: https://github.com/fiehrfly/muses
