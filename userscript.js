// ==UserScript==
// @name        Wanikani Aoyagi Font Switcher
// @author      Aly
// @description Switches font based on difficulty of WK review item
// @run-at      document-end
// @match       https://www.wanikani.com/subjects/review*
// @match       http://www.wanikani.com/subjects/review*
// @version     1.0
// @grant       none
// @license     MIT
// @resource    gyousho    https://github.com/s5bug/wk_aoyagi/raw/refs/heads/main/KouzanGyoushoOTF.otf
// @resource    sousho     https://github.com/s5bug/wk_aoyagi/raw/refs/heads/main/KouzanSoushoOTF.otf
// ==/UserScript==

(function() {
    'use strict';

    const gyousho = new FontFace("KouzanBrushFontGyousho", `url(${GM_getResourceURL("gyousho")})`);
    document.fonts.add(gyousho);
    const sousho = new FontFace("KouzanBrushFontSousho", `url(${GM_getResourceURL("sousho")})`);
    document.fonts.add(sousho);

    const stylesheet = new CSSStyleSheet();
    document.adoptedStyleSheets.push(stylesheet);

    const normalFontRules = () => stylesheet.replaceSync("");
    const gyoushoFontRules = () =>
        stylesheet.replaceSync(`div[data-quiz-header-target=\"characters\"] {
            font-family: KouzanBrushFontGyousho;
        }`);
    const soushoFontRules = () =>
        stylesheet.replaceSync(`div[data-quiz-header-target=\"characters\"] {
            font-family: KouzanBrushFontSousho;
        }`);

    const ruleFns = [normalFontRules, gyoushoFontRules, soushoFontRules];

    const id_to_srs = {};

    // Create object mapping item id to srs stage
    const id_srs_element = document.querySelector("script[data-quiz-queue-target=\"subjectIdsWithSRS\"]");

    if (!id_srs_element) {
        console.error("Failed to find the expected script element with data-quiz-queue-target=\"subjectIdsWithSRS\"");
        return;
    }

    try {
        const id_srs_data = JSON.parse(id_srs_element.innerHTML);

        // Extract the relevant part of the data
        const id_srs_array = id_srs_data.subject_ids_with_srs_info;

        if (Array.isArray(id_srs_array)) {
            // Convert to a mapping of id => srs stage
            for (const [id, stage, _] of id_srs_array) {
                id_to_srs[id] = stage;
            }
        } else {
            console.error("Parsed data is not in the expected format:", id_srs_data);
            return;
        }
    } catch (error) {
        console.error("Error parsing JSON or converting entries:", error);
        return;
    }

    window.addEventListener("willShowNextQuestion", e => {
        if(e.detail && e.detail.subject && e.detail.subject.id) {
            const item_id = e.detail.subject.id;
            const srs = id_to_srs[item_id] || 0;
            if(srs >= 7) {
                // randomize between normal, gyousho, or sousho
                ruleFns[Math.floor(Math.random() * 3)]()
            } else if(srs >= 5) {
                ruleFns[Math.floor(Math.random() * 2)]()
            } else {
                ruleFns[0]()
            }
        } else {
            console.error("Invalid event detail structure:", e.detail);
        }
    });
})();
