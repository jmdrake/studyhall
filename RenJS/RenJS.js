
var game = new Phaser.Game(config.stageSize.w, config.stageSize.h, Phaser.WEBGL, "RenJS");

var RenJS = {};

RenJS.startGame = function(){        
    game.state.add("preload", {
        preload: function(){
            _.each(config.storyFiles,function (file,index) {
                game.load.text("story"+index, file);
            });
            game.load.image('splash', config.splash);
        },
        create: function(){
            game.scale.pageAlignHorizontally = true;
            game.scale.pageAlignVertically = true;
            game.scale.refresh(); 
            RenJS.splash = game.add.image(0,0,"splash");
            var story = {};
            _.each(config.storyFiles,function (file,index) {
                var text = jsyaml.load(game.cache.getText("story"+index));
                story = _.extend(story,text);
            });
            RenJS.story = story;
            if (story.simpleGUI){
                RenJS.gui = new SimpleGUI(story.simpleGUI);    
            } else {
                // this.gui = new RenJS.story.gui.customGUI();
            }    
            //preload the fontss
            _.each(story.simpleGUI.assets.fonts,function(font){
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
                _.each(RenJS.story.setup.extra.scripts,function(file,key){
                    console.log("loading "+key+ " "+file)
                    game.load.script(key, file);
                });
            }
        },

        create: function(){
            game.state.start("story");
        }
    });

    game.state.add("story", {
        create:function(){            
            // RenJS.splash = game.add.image(0,0,"splash");
            RenJS.storyManager.setupStory();
            RenJS.gui.init();
            game.input.onTap.add(function(pointer,doubleTap){
                if (RenJS.control.paused){
                    return;
                }
                if (RenJS.control.waitForClick && !RenJS.control.clickLocked){
                    // var buttonPressed = _.find(RenJS.tbManager.buttons,function(button){
                    //     var localPosition = game.input.getLocalPosition(button, pointer);
                    //     return game.input.hitTest(button,pointer,localPosition);
                    // },this);  
                    // var buttonPressed = false;
                    // if (!buttonPressed) {
                        RenJS.control.waitForClick = false;  
                        RenJS.control.lockClick();
                        RenJS.control.nextAction();
                    // }
                }
                if (config.settings.skipping || config.settings.auto){
                    config.settings.skipping = false;
                    config.settings.auto = false;
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
    execStack:[{c:-1}],
    paused: false,
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
        RenJS.control.waitForClick = false; 
        var resolve = RenJS.control.resolve;
        RenJS.control.resolve = null;     
        console.log("Resolving "+RenJS.control.action);
        resolve();
    }
    
}

RenJS.portrait = config.portrait;





// RenJS.characters = {};

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

    this.skip = function(){
        config.settings.skipTime = 50;
        config.settings.skipping = true;
        console.log("skipping");
    }

    this.auto = function(){
        config.settings.skipTime = 1000;
        config.settings.auto = true;
        console.log("autoplaying")
    }

    this.save = function(slot) {
        if (!slot){
            slot = 0;
        }
        var data = {
            background: RenJS.bgManager.current.name,
            characters: RenJS.chManager.showing,
            audio: RenJS.audioManager.current,
            cgs: RenJS.cgsManager.current,
            stack: RenJS.control.execStack,
            vars: RenJS.logicManager.vars
        }
        
        if (RenJS.customContent.save){
            RenJS.customContent.save(data);
        }
        console.log("SAVING");
        console.log(data);
        var data = JSON.stringify(data);
        console.log(data);
        localStorage.setItem("RenJSDATA"+slot,data);
    } 

    this.load = function(slot){
        if (!slot){
            slot = 0;
        }
        console.log("LOADING slot "+slot);
        var data = localStorage.getItem("RenJSDATA"+slot);
        if (!data){
            this.start();    
            return;
        } 
        console.log(data);
        data = JSON.parse(data);
        console.log(data);
        // RenJS.transitions.FADETOCOLOUROVERLAY(0x000000);
        RenJS.bgManager.set(data.background);
        RenJS.chManager.set(data.characters);
        RenJS.audioManager.set(data.audio);
        RenJS.cgsManager.set(data.cgs);
        RenJS.logicManager.vars = data.vars;
        var stack = _.last(data.stack);
        var scene = stack.scene;
        var allActions = _.clone(RenJS.story[scene]);
        var actions = allActions.slice(stack.c+1);
        if(data.stack.length != 1){
            for (var i = data.stack.length-2;i>=0;i--){
                var nestedAction = allActions[stack.c];
                stack = data.stack[i];                
                switch(stack.action){
                    case "interrupt":
                        nestedAction = allActions[data.stack[i+1].interrupting];
                        allActions = nestedAction.interrupt[stack.index][stack.op];
                        break;
                    case "choice":
                        allActions = nestedAction.choice[stack.index][stack.op];
                        break;
                    case "if":
                        var action = _.keys(nestedAction)[0];
                        allActions = nestedAction[action];

                }
                var newActions = allActions.slice(stack.c+1);;
                actions = newActions.concat(actions);
            }            
        }
        RenJS.control.execStack = data.stack;
        RenJS.storyManager.currentScene = actions;
        // RenJS.transitions.FADEOUTCOLOUROVERLAY();
        RenJS.control.paused = false;
        RenJS.storyManager.interpret();
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
        RenJS.control.execStack = [{c:-1,scene:name}];
        // _.each(RenJS.characters,function(character,name){
        //     character.hide();
        // });
        // RenJS.bgManager.hide(RenJS.transitions.FADETOBLACK);
        // this.waitForContinue();
        RenJS.chManager.hideAll();
        // RenJS.bgManager.hide();
        RenJS.cgsManager.hideAll();
        // RenJS.audioManager.stop();
        this.currentScene = _.clone(RenJS.story[name]);
        
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
        if (_.has(RenJS.audioManager.musicList,actor)){
            return "bgm";
        }
        if (_.has(RenJS.audioManager.sfx,actor)){
            return "sfx";
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
        function getKey(act){
            return _.keys(act)[0];
        }
        return new Promise(function(resolve, reject) {
            RenJS.control.resolve = resolve;
            var key = getKey(action);
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
                    action.transitionName = str[str.indexOf("WITH")+1];                    
                } else {
                    action.transitionName = config.transitions[actorType];
                }                
                action.transition = RenJS.transitions[action.transitionName];
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
            RenJS.control.wholeAction = params; 
            RenJS.control.nextAction = null; 
            console.log("Doing "+RenJS.control.action);
            switch(RenJS.control.action){
                // case "custom": RenJS.control.action = "Custom fct"; action.execute(); break;
                case "var" :
                    RenJS.logicManager.setVar(actor,params);
                    break;
                case "if" :
                    var condition = key.substr(key.indexOf("("));
                    var branches = {
                        ISTRUE: action[key]
                    };
                    var next = _.first(RenJS.storyManager.currentScene);
                    if (next && getKey(next) == "else"){
                        branches.ISFALSE = next.else;
                        RenJS.storyManager.currentScene.shift();
                    }
                    RenJS.logicManager.branch(condition,branches);
                    break;
                case "else" :
                    RenJS.resolve();
                    break;
                case "show" :                     
                    action.manager.show(actor,action.transition,action);
                    break;
                case "hide" : 
                    action.manager.hide(actor,action.transition);
                    break;
                case "say" : 
                    RenJS.textManager.say(actor,params);
                    break;
                case "wait" : 
                    RenJS.storyManager.waitTimeout(parseInt(params));
                    break;
                case "animate" :
                    console.log(action);
                    RenJS.cgsManager.animate(actor,action,action.time)
                    break;
                case "choice" : 
                    // debugger;
                    config.settings.skipping = false;
                    RenJS.logicManager.showChoices(_.clone(params));
                    break;
                case "interrupt" : 
                    // debugger;
                    if (params == "stop"){
                        // console.log("interrupting");
                        RenJS.logicManager.interrupting = false;
                        RenJS.logicManager.choose();
                    } else {
                        RenJS.logicManager.interrupting = true;
                        RenJS.logicManager.showChoices(_.clone(params));
                    }
                    break;
                case "text" :
                    RenJS.textManager.show(params);
                    break;
                case "play" :
                    // debugger;
                    if (actorType == "bgm"){
                        RenJS.audioManager.play(actor, "bgm", action.looped, action.transitionName);
                    } else {
                        RenJS.audioManager.playSFX(actor);
                        RenJS.resolve();
                    }
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
                case "call" :
                    RenJS.customContent[actor](params);
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
                // console.log("Resolving somthing here");
                resolve();
            } else {
                var action = RenJS.storyManager.currentScene.shift();
                RenJS.control.execStack[0].c++;
                // console.log("Stack is");
                // console.log(RenJS.control.execStack[0]);
                if (RenJS.control.execStack[0].c == RenJS.control.execStack[0].total){
                    RenJS.control.execStack.shift();
                    // console.log("Stack is");
                    // console.log(RenJS.control.execStack[0]);
                }
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
        RenJS.control.nextAction = callback ? callback : RenJS.resolve;
        if (config.settings.skipping || config.settings.auto){
            var act = RenJS.control.wholeAction;
            setTimeout(function(){
                console.log("skipping action "+RenJS.control.action);
                console.log(act);
                RenJS.control.nextAction();
            },config.settings.skipTime);
        } else {
            RenJS.control.waitForClick = true;
        }
    }

    this.waitTimeout = function(time,callback){
        RenJS.control.nextAction = callback ? callback : RenJS.resolve;
        if (config.settings.skipping){
            RenJS.control.nextAction();
        } else {
            setTimeout(function(){
                RenJS.control.nextAction();
            },time ? time : RenJS.control.timeout);
        }        
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





RenJS.bgManager = new BackgroundManager();
RenJS.chManager = new CharactersManager();
RenJS.audioManager = new AudioManager();
RenJS.cgsManager = new CGSManager();
RenJS.textManager = new TextManager();
RenJS.tweenManager = new TweenManager();
RenJS.logicManager = new LogicManager();


RenJS.storyManager = new StoryManager();



RenJS.startGame();