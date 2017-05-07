var config = {
    //name of the game
    name: "RenJS-GAME",
    story: "Story/YourStory.yaml",
    gui: "Story/GUI.yaml",
    stageSize : {w:1280,h:720},
    textDefaults: {
        font: "bold 16pt Arial",
        fill: "#FFFFFF",
        align: "left"
    },
    settings: {
        textSpeed: 150
    },
    splash: "assets/gui/Splash.png",

    //stage width and height

    //miliseconds for fade transitions
    fadeTime : 750,
    //miliseconds to wait before continuing
    timeout : 5000,
    //avoid continuous clicking by waiting a few miliseconds before accepting new "clicks"
    clickCooldown: 200,
    //dialogue portrait options
    portrait : {
        //show a portrait?
        showPortrait: false,
        //coordinates where the portrait will be shown, anchored to its center
        position: {x:0,y:0}
    },

    transitions: {
        ch: "CUT",
        bg: "FADE",
        cgs: "FADE",
        bgm: "FADE"
    },
    //menu options
    menu: {
        //default style menu?
        default: true,
        //menu state to use instead
        custom: null
    },
    //dialogue and text box options
    textBox :{
        //text box position, anchored to the center bottom of the box sprite
        position :{x: 900/2, y:640},
        //blinking image to show click wait
        ctc :{x: 730, y:600},
        //save button
        save: {x: 780, y:600},
        //go back button
        back: {x: 705, y:600},
        //fast forward button
        ff: {x: 755, y:600},
        //name box
        name :{x: 80, y:465, size: 16, font:"felipa"},
        //text position, size and total width
        text: {x: 80, y:520, size: 14, width: 800, delay:150, font: "exo", colour: "#AAAAAA"}
    }

}
