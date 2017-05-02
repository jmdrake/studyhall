
var game = new Phaser.Game(config.stageSize.w, config.stageSize.h, Phaser.CANVAS, "RenJS");

var RenJS = {};

RenJS.startGame = function(){        
    game.state.add("preload", {
        preload: function(){
            game.load.text('RenJS_Story', config.story);
            game.load.text('RenJS_GUI', config.gui);
            game.load.image('splash', config.splash);
        },
        create: function(){
            game.scale.pageAlignHorizontally = true;
            game.scale.pageAlignVertically = true;
            game.scale.refresh(); 
                       
            RenJS.story = jsyaml.load(game.cache.getText('RenJS_Story'));
            var guiSetup = jsyaml.load(game.cache.getText('RenJS_GUI'));
            if (guiSetup.simpleGUI){
                RenJS.gui = new SimpleGUI(guiSetup.simpleGUI);    
            } else {
                // this.gui = new RenJS.story.gui.customGUI();
            }    
            //preload the fontss
            _.each(guiSetup.simpleGUI.assets.fonts,function(font){
                console.log("loading" + font)
                game.add.text(20, 20, font, {font: '42px '+font});
            });
            
            // game.add.text(20, 20, 'BODY', {font: '42px elliotsix'});
            game.state.start("init");
        }
    });
    game.state.add("init", {
        preload: function(){
            //preload gui
            _.each(RenJS.gui.getAssets(),function(asset){
                // console.log(asset);
                if (asset.type == "spritesheet"){
                    game.load.spritesheet(asset.key, asset.file, asset.w, asset.h);
                } else {
                    game.load[asset.type](asset.key, asset.file);
                }
            });

            //preload backgrounds
            _.each(RenJS.story.setup.backgrounds,function(filename,background){
                game.load.image(background, filename);
            });
            //preload cgs
            _.each(RenJS.story.setup.cgs,function(filename,background){
                game.load.image(background, filename);
            });
            // preload background music
            _.each(RenJS.story.setup.music,function(filename,music){
                game.load.audio(music, filename);
            });
            //preload sfx
            _.each(RenJS.story.setup.sfx,function(filename,key){
                game.load.audio(key, filename);
            },this);
            //preload characters
            _.each(RenJS.story.setup.characters,function(character,name){
                _.each(character.looks,function(filename,look){
                    game.load.image(name+"_"+look, filename);
                });
            });
            if (RenJS.story.setup.extra){
                _.each(RenJS.story.setup.extra.spritesheets,function(file,key){
                    var str = file.split(" ");
                    game.load.spritesheet(key, str[0], parseInt(str[1]),parseInt(str[2]));
                });
            }
        },

        create: function(){
            game.state.start("story");
        }
    });

    game.state.add("story", {
        create:function(){            
            RenJS.splash = game.add.image(0,0,"splash");
            RenJS.storyManager.setupStory();
            // RenJS.dlgManager.init();
            
            RenJS.gui.init();
            game.input.onTap.add(function(pointer,doubleTap){
                              
                if (RenJS.control.waitForClick && !RenJS.control.clickLocked){
                    // var buttonPressed = _.find(RenJS.tbManager.buttons,function(button){
                    //     var localPosition = game.input.getLocalPosition(button, pointer);
                    //     return game.input.hitTest(button,pointer,localPosition);
                    // },this);  
                    var buttonPressed = false;
                    if (!buttonPressed) {
                        RenJS.control.waitForClick = false;  
                        RenJS.control.lockClick();
                        RenJS.control.nextAction();
                    }
                }
            }, this);
            RenJS.audioManager.init(function(){
                RenJS.splash.destroy();
                RenJS.gui.showMenu("main");    
            });
            
            
            // RenJS.storyManager.startScene("start");
            // RenJS.storyManager.interpret();
        }
    });
    game.state.start("preload");
}


RenJS.positions = {
    LEFT: {x:config.stageSize.w/6,y:config.stageSize.h},
    CENTER: {x:config.stageSize.w/2,y:config.stageSize.h},
    RIGHT: {x:(config.stageSize.w/6)*5,y:config.stageSize.h}
}

RenJS.control = {
    fadeTime : config.fadeTime,
    timeout : config.timeout,
    waitForClick : false,
    resolve : null,
    clickLocked: false,
    nextAction: null,
    clickCooldown: config.clickCooldown,
    lockClick: function(){
        RenJS.control.clickLocked = true;
        setTimeout(function() {
            RenJS.control.clickLocked = false
        }, RenJS.control.clickCooldown);                                              
    }
}

RenJS.resolve = function(){
    if (RenJS.control.resolve != null){
        // debugger;
        var resolve = RenJS.control.resolve;
        RenJS.control.resolve = null;     
        console.log("Resolving "+RenJS.control.action);
        resolve();
    }
    
}

RenJS.portrait = config.portrait;



function VariablesManager(){
    this.vars = {};
    this.setVar = function(name,value){
        value = value+"";
        value = this.parseVars(value);
        try {
           var val = eval(value);
           this.vars[name] = val;
        } catch(e) {
            this.vars[name] = value;
        }
        // if (isNaN(value)){
            
        // } else {
        //     // debugger;
        //     // if (value.indexOf("+") != -1){
        //     //     this.vars[name] += parseInt(value);
        //     // } else if (value.indexOf("-") != -1){
        //     //     this.vars[name] -= parseInt(value);
        //     // } else {
        //         this.vars[name] = value;
        //     // }
        // }
        RenJS.resolve();
    }

    this.branch = function(expression,branches){
        expression = expression+"";
        expression = this.parseVars(expression);
        // debugger;
        try {
            var val = eval(expression);
            if (val && branches.ISTRUE){
                var actions = branches.ISTRUE;
                RenJS.storyManager.currentScene = _.union(actions,RenJS.storyManager.currentScene);
            } 
            if (!val && branches.ISFALSE){
                var actions = branches.ISFALSE;
                RenJS.storyManager.currentScene = _.union(actions,RenJS.storyManager.currentScene);
            }
        } catch(e) {
            console.log("couldn-t eval");
        }
        RenJS.resolve();
    }

    this.parseVars = function(text){
        var vars = text.match(/\{(.*?)\}/g);
        if (vars) {
            _.each(vars,function(v){
                var varName = v.substring(1,v.length-1);
                text = text.replace(v,this.vars[varName]);
            },this);
        }
        return text;
    }
}

RenJS.varsManager = new VariablesManager();

// RenJS.characters = {};

function Character(name,speechColour){
    
    this.name = name;
    // RenJS.characters[this.name] = this;
    this.looks = {};
    this.currentLook = null;
    this.speechColour = speechColour;

    this.addLook = function(lookName,image){        
        var look = RenJS.storyManager.characterSprites.create(RenJS.positions.CENTER.x,RenJS.positions.CENTER.y,(image ? image : lookName));
        look.anchor.set(0.5,1);
        look.alpha = 0;
        look.name = lookName;
        this.looks[lookName] = look;
        if (!this.currentLook){
            this.currentLook = this.looks[lookName];
        }
    }
}

function CharactersManager(){
    this.characters = {};
    this.showing = {};

    this.add = function(name,displayName,speechColour,looks){
        this.characters[name] = new Character(displayName,speechColour);
        _.each(looks,function(filename,look){
            this.characters[name].addLook(look,name+"_"+look);
        },this);
    }

    this.show = function(name,transition,props){        
        var ch = this.characters[name];
        var oldLook = ch.currentLook;
        ch.currentLook = props.look ? ch.looks[props.look] : ch.looks.normal;
        if (!props.position){
            props.position = (oldLook != null) ? {x:oldLook.x,y:oldLook.y} : RenJS.positions.CENTER;
        }
        var scaleX = oldLook != null ? oldLook.scale.x : 1;
        if (props.flipped != undefined){
            scaleX = props.flipped ? -1 : 1;
        }
        this.showing[name] = true;
        transition(oldLook,ch.currentLook,props.position,scaleX);
    }

    this.hide = function(name,transition){
        var ch = this.characters[name];
        var oldLook = ch.currentLook;        
        ch.currentLook = null;
        delete this.showing[name];
        // console.log("hiding ch "+name);
        transition(oldLook,null);
    }

    this.hideAll = function(){
        _.each(this.showing,function(showing,name){
            this.hide(name,RenJS.transition.FADEOUT);
        },this);
    }

    this.say = function(name,text){
        RenJS.dlgManager.show(text,this.characters[name].name,this.characters[name].speechColour);
    }
}

RenJS.chManager = new CharactersManager();


function CGSManager(){
    this.cgs = {};

    this.show = function(name,transition,props){
        console.log(name);
        console.log(transition);
        console.log(props);
        var position = props.position ? props.position : {x:game.world.centerX,y:game.world.centerY};
        
        this.cgs[name] = RenJS.storyManager.cgsSprites.create(position.x,position.y,name);            
        this.cgs[name].anchor.set(0.5);        
        this.cgs[name].alpha = 0;
        if (props.zoom){
            this.cgs[name].scale.set(props.zoom);    
        }        
        if (props.angle){
            this.cgs[name].angle = props.angle;
        }        
        transition(null,this.cgs[name],position);
    }

    this.animate = function(name,toTween,time){
        // debugger;
        var tweenables = {};
        if (toTween.alpha != undefined && toTween.alpha != null) {
            tweenables.alpha = toTween.alpha;
        }
        if (toTween.angle != undefined && toTween.angle != null) {
            tweenables.angle = toTween.angle;
        }
        if (toTween.position != undefined && toTween.position != null) {
            tweenables.x = toTween.position.x;
            tweenables.y = toTween.position.y;
        }
        if (toTween.zoom != undefined && toTween.zoom != null) {
            RenJS.tweenManager.parallel([
                {sprite:this.cgs[name],tweenables:tweenables},
                {sprite:this.cgs[name].scale,tweenables:{x:toTween.zoom,y:toTween.zoom},callback:RenJS.resolve},
            ],time);
        } else {
            RenJS.tweenManager.tween(this.cgs[name],tweenables,RenJS.resolve,time,true);
        }
    }

    this.hide = function(name,transition){
        if (this.cgs[name]){
            RenJS.control.nextAction = function(){
                this.cgs[name].destroy();
                delete this.cgs[name];
                RenJS.resolve();
            }
            transition(this.cgs[name],null);
        } else {
            RenJS.resolve();
        }
    }

    this.hideAll = function(){

    }
}

RenJS.cgsManager = new CGSManager();

function TweenManager(){
    this.current = [];

    this.tween = function(sprite,tweenables,callback,time,start){
        var tween = game.add.tween(sprite);
        tween.to(tweenables, time, Phaser.Easing.Linear.None);
        if(callback){
            tween.onComplete.add(callback, this);
            tween.callbackOnComplete = callback;
        }        
        tween.tweenables = tweenables;
        if (start){
            this.current = [];
            RenJS.storyManager.waitForClick(this.skip);
            tween.start();
        }
        this.current.push(tween);
        return tween;
    }

    this.chain = function(tweens,time){
        this.current = [];
        var lastTween = null;
        _.each(tweens,function(tween){
            var tween = this.tween(tween.sprite,tween.tweenables,tween.callback,time/tweens.length,false);
            if (lastTween){
                lastTween.chain(tween);
            }
            lastTween = tween;
        },this);
        RenJS.storyManager.waitForClick(this.skip);
        this.current[0].start();
    }

    this.parallel = function(tweens,time){
        this.current = [];
        _.each(tweens,function(tween){
            var tween = this.tween(tween.sprite,tween.tweenables,tween.callback,time,false);
            tween.start();
        },this);    
        RenJS.storyManager.waitForClick(this.skip);    
    }

    this.skip = function(){
        console.log("skipping");
        var tweens = this.current;
        this.current = [];
        _.each(tweens,function(tween){
            tween.stop(false);
            _.each(tween.tweenables,function (value,property) {
                tween.target[property] = value;
            });
            if (tween.callbackOnComplete){
                tween.callbackOnComplete();
            }            
        });        
    }
}

RenJS.tweenManager = new TweenManager();

function BackgroundManager(){

    this.backgrounds = {};
    this.current = null;

    this.add = function(name,image){
        this.backgrounds[name] = RenJS.storyManager.backgroundSprites.create(game.world.centerX,game.world.centerY,(image ? image : name));
        this.backgrounds[name].anchor.set(0.5);
        this.backgrounds[name].alpha = 0;
    }

    this.show = function(name,transition){   
        var oldBg = this.current;
        this.current = name ? this.backgrounds[name] : null;
        // console.log("showing bg "+name);
        // debugger;
        transition(oldBg,this.current,{x:game.world.centerX,y:game.world.centerY});        
    }

    this.hide = function(bg,transition){   
        this.show(null,transition ? transition : RenJS.transition.FADEOUT);
    }
}

RenJS.bgManager = new BackgroundManager();

function StoryManager(){

    this.scenes = {};

    this.pause = function(){
        this.paused = true;
        RenJS.gui.hideHUD();
    }

    this.unpause = function(){
        this.paused = false;
        RenJS.gui.showHUD();
    }

    this.start = function(){
        this.paused = false;
        RenJS.storyManager.startScene("start");
        RenJS.storyManager.interpret();
    }

    this.load = function(){
        this.start();
    }

    this.setupStory = function(){        
        //load backgrounds
        this.backgroundSprites = game.add.group();
        _.each(RenJS.story.setup.backgrounds,function(filename,background){
            RenJS.bgManager.add(background,background);
        });
        //load characters
        this.behindCharactersSprites = game.add.group();
        this.characterSprites = game.add.group();
        _.each(RenJS.story.setup.characters,function(character,name){
            var displayName = character.displayName ? character.displayName : name;
            RenJS.chManager.add(name,displayName,character.speechColour,character.looks);
        });
        this.cgsSprites = game.add.group();
    }

    // this.addScene = function(name,scene){
    //     this.scenes[name] = scene;        
    // }

    this.startScene = function(name){
        // _.each(RenJS.characters,function(character,name){
        //     character.hide();
        // });
        // RenJS.bgManager.hide(RenJS.transitions.FADETOBLACK);
        // this.waitForContinue();
        // RenJS.chManager.hideAll();
        // RenJS.bgManager.hide();
        // RenJS.cgsManager.hide();
        // RenJS.audioManager.stop();
        this.currentScene = RenJS.story[name];
        RenJS.resolve();
        // this.interpretScene();        
    }

    this.getActorType = function(actor){
        // is actor background or character
        if (!actor) {
            return null;
        }
        if (_.has(RenJS.chManager.characters,actor)){
            return "ch";
        }
        if (_.has(RenJS.bgManager.backgrounds,actor)){
            return "bg";
        }
        return "cgs";
    }

    this.interpretAction = function(action){
        // var availableActions = {
        //     "show":["ch","bg"],
        //     "hide":["ch","bg"],
        //     "say":["ch"],
        //     "choice":[]
        // };
        var actionParams = {
            withTransition: ["show","hide","play"],
            withPosition: ["show"]
        }
        return new Promise(function(resolve, reject) {
            RenJS.control.resolve = resolve;
            var key = _.keys(action)[0];
            var str = key.split(" ");
            var mainAction,actor;
            if (str[1] == "says") {
                mainAction = "say";
                actor = str[0];
            } else {
                mainAction = str[0];
                actor = str[1];
            }            
            var actorType = RenJS.storyManager.getActorType(actor);
            //parse WITH and AT
            var params = action[key];
            if (_.contains(actionParams.withTransition,mainAction)){
                str = params ? params.split(" ") : [];
                if (str.indexOf("WITH")!=-1){
                    action.transition = str[str.indexOf("WITH")+1];
                    action.transition = RenJS.transitions[action.transition];
                } else {
                    action.transition = RenJS.transitions[config.transitions[actorType]];
                }                
                
            }
            if (params && _.contains(actionParams.withPosition,mainAction)){
                str = params ? params.split(" ") : [];
                if (str.indexOf("AT")!=-1){
                    action.position = str[str.indexOf("AT")+1];
                    if (_.has(RenJS.positions,action.position)){
                        action.position = RenJS.positions[action.position];
                    } else {
                        var coords = action.position.split(",");
                        action.position = {x:parseInt(coords[0]),y:parseInt(coords[1])};
                    }
                }
                if (str.length>0 && str[0]!="AT" && str[0]!="WITH"){
                    action.look = str[0];
                }
            }
            action.manager = RenJS[actorType+"Manager"];
            RenJS.control.action = mainAction; 
            console.log("Doing "+RenJS.control.action);
            switch(RenJS.control.action){
                // case "custom": RenJS.control.action = "Custom fct"; action.execute(); break;
                case "var" :
                    RenJS.varsManager.setVar(actor,params);
                    break;
                case "if" :
                    console.log(params);
                    console.log(action);
                    RenJS.varsManager.branch(params,action);
                    break;
                case "show" :                     
                    action.manager.show(actor,action.transition,action);
                    break;
                case "hide" : 
                    action.manager.hide(actor,action.transition);
                    break;
                case "say" : 
                    RenJS.chManager.say(actor,params);
                    break;
                case "wait" : 
                    RenJS.storyManager.waitTimeout(parseInt(params));
                    break;
                case "animate" :
                    console.log(action);
                    RenJS.cgsManager.animate(actor,action,action.time)
                    break;
                case "choice" : 
                    // debugger;s
                    RenJS.choiceManager.show(params);
                    break;
                case "interrupt" : 
                    // debugger;
                    if (params == "stop"){
                        RenJS.choiceManager.interrupting = false;
                        RenJS.choiceManager.hide();
                    } else {
                        RenJS.choiceManager.interrupt(params);
                    }
                    break;
                case "text" :
                    RenJS.dlgManager.show(params);
                    break;
                case "play" :
                    RenJS.audioManager.play(actor, "bgm", action.looped, action.transition);
                    break;
                case "effect" :
                    RenJS.effects[params](action.sfx);
                    break;
                case "ambient" :
                    RenJS.ambient[params](action.sfx);
                    break;
                case "scene" :
                    RenJS.storyManager.startScene(params);
                    break;
                case "jsScript" :
                    params();
                    break;
            }
            
        }); 
    }

    this.interpret = function() {
        return new Promise(function(resolve, reject) {
            if (RenJS.storyManager.currentScene.length == 0){
                resolve();
            } else {
                var action = RenJS.storyManager.currentScene.shift();
                console.log("About to do");
                console.log(action);
                RenJS.storyManager.interpretAction(action).then(function(){
                    console.log("Done with last action");
                    return RenJS.storyManager.interpret();
                }).then(function(){
                    resolve();
                });
            };         
        }); 
    }



    this.waitForClick = function(callback){
        RenJS.control.nextAction = callback ? callback : RenJS.resolve();
        RenJS.control.waitForClick = true;
    }

    this.waitTimeout = function(time,callback){
        RenJS.control.nextAction = callback ? callback : RenJS.resolve();
        setTimeout(function(){
            RenJS.control.nextAction();
        },time ? time : RenJS.control.timeout);
    }

    this.waitForClickOrTimeout = function(time,callback){        
        RenJS.control.nextAction = callback;
        RenJS.control.waitForClick = true;
        setTimeout(function(){
            RenJS.control.waitForClick = false;
            RenJS.control.nextAction();
        },time ? time : RenJS.control.timeout);        
    }



    // this.waitForContinue = function(){        
    //     RenJS.control.continue = false;
    //     while(!RenJS.control.continue){};
    //     RenJS.control.continue = false;
    // }
}


// function 

function ChoiceManager(){

    this.interrupt = function (choices) {
        this.interrupting = true;
        this.show(choices);
    };

    this.show = function(choices){

        console.log(choices);
        this.currentChoices = choices;     
        RenJS.gui.showChoices(choices); 
        if (this.interrupting){
            RenJS.resolve();
        }
    }

    this.choose = function(index,chosenOption){
        RenJS.gui.hideChoices();
        if (chosenOption){
            var actions = this.currentChoices[index][chosenOption];
            RenJS.storyManager.currentScene = _.union(actions,RenJS.storyManager.currentScene);
        }
        if (this.interrupting){
            this.interrupting = false;
        } else {
            RenJS.resolve();
        }
    }
}

RenJS.choiceManager = new ChoiceManager();

function AudioManager(){
    this.musicList = {};
    this.sfx = {};

    this.muted = false;
    this.audioLoaded = false;

    this.current = {
        bgm : null,
        bgs : null
    }

    this.init = function(callback){
        var audioList = [];
        _.each(RenJS.story.setup.music,function(filename,key){
            this.musicList[key] = game.add.audio(key);
            audioList.push(this.musicList[key]);
            // music.onDecoded.add(function(){
            //     console.log("adding music");
            //     console.log(key);
            //     console.log(music);
            //     this.musicList[key] = music;
            // }, this);
        },this);
        
        _.each(RenJS.story.setup.sfx,function(filename,key){
            this.sfx[key] = game.add.audio(key);            
            audioList.push(this.sfx[key]);
        },this);
        game.sound.setDecodedCallback(audioList, function(){
            console.log("Audio loaded");
            this.audioLoaded = true;
            callback();
        }, this);
    }

    this.mute = function(){
        this.muted = true;
        if (this.current.bgm) {
            this.current.bgm.stop();
        }
        if (this.current.bgs) {
            this.current.bgs.stop();
        }
        RenJS.resolve();
    }

    this.unmute = function(){
        this.muted = false;
        if (this.current.bgm) {
            this.current.bgm.stop();
        }
        if (this.current.bgs) {
            this.current.bgs.stop();
        }
        RenJS.resolve();
    }

    this.play = function(key,type,looped,transition){
        // debugger;
        var oldAudio = this.current[type];
        this.current[type] = this.musicList[key];
        if (!this.muted && this.current[type]) {
            if (transition == "FADE") {
                this.current[type].fadeIn(1500,looped);
                if (oldAudio) {
                    oldAudio.fadeOut(1500);
                };
            } else {
                if (oldAudio) {
                    oldAudio.stop();
                }
                this.current[type].play("",0,1,looped);
            }
        }
        if (type == "bgm") {
            RenJS.resolve();    
        }
    }

    this.stopAll = function(){
        this.stop("bgs","FADE");
        this.stop("bgm","FADE");
    }

    this.stop = function(type, transition){
        if (!this.current[type]){
            return;
        }
        var oldAudio = this.current[type];
        this.current[type] = null;
        if (!this.muted) {
            if (transition == "FADE") {
                oldAudio.fadeOut(1500);
            } else {
                oldAudio.stop();
            }
        }
        if (type == "bgm") {
            RenJS.resolve();    
        }
    }

    this.playSFX = function(key){
        if (this.audioLoaded){
            // debugger;            
            this.sfx[key].play();    
        }
        
        // var fx = game.add.audio(key);
        // fx.onStop.add(function(){
        //     RenJS.resolve();
        // });
    }
}

RenJS.audioManager = new AudioManager();

function DialogueManager(){

    this.show = function(text,title,colour){
        var t = RenJS.varsManager.parseVars(text);
        RenJS.gui.showText(t,title,colour,function(){
            RenJS.storyManager.waitForClick(RenJS.dlgManager.hide);
        });
    };

    this.showCTC = function(){
        var ctc = RenJS.dlgManager.clickToContinue;
        ctc.tween = game.add.tween(ctc).to({ alpha: 1 }, 250, Phaser.Easing.Linear.None,true,0,-1);
    }

    this.hide = function(){
        RenJS.gui.hideText();
        RenJS.resolve();
    }
}

RenJS.dlgManager = new DialogueManager();

RenJS.storyManager = new StoryManager();



RenJS.startGame();