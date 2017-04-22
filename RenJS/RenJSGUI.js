function SimpleGUI(meta){
    this.elements = meta ;

    this.getAssets = function(){
        var assets = _.map(this.elements.assets.images,function(asset,key){
            return {key:key, file:asset, type: "image"};
        });
        var list = _.map(this.elements.assets.spritesheets,function(asset,key){
            var e = asset.split(" ");
            return {key:key,file:e[0],w:parseInt(e[1]),h:parseInt(e[2]), type: "spritesheet"};
        });
        assets = _.union(assets,list);
        list = _.map(this.elements.assets.sound,function(asset,key){
            return {key:key, file:asset, type: "audio"};
        });
        assets = _.union(assets,list);
        return assets;
    }

    this.getSpriteInfo = function(spriteInfo){
        var info = spriteInfo.split(" ");
        return {x: parseInt(info[1]), y:parseInt(info[2]), key:info[0]};
    }

    this.getBoundingBoxInfo = function(bbInfo){
        var info = bbInfo.split(" ");
        return {x: parseInt(info[0]), y:parseInt(info[1]), w:parseInt(info[2]), h:parseInt(info[3])};
    }

    this.init = function(){
        this.initHUD();
        this.initChoices();
        this.menus = {};
        _.each(this.elements.menus,function(menu,name){
            this.initMenu(name,menu);
        },this);
    }

    this.initChoices = function(){
        var choiceSprite = this.elements.hud.choice.box;
        var dimensions = this.getSpriteInfo(this.elements.assets.spritesheets[choiceSprite]);
        var choiceStyle = _.extend(config.textDefaults,this.elements.hud.choice.text);
        this.hud.choices = {
            key: choiceSprite,
            w: dimensions.x,
            h: dimensions.y,
            style: choiceStyle,
            boxes: game.add.group()
        }
    }

    this.initHUD = function(){
        this.hud = {
            group: game.add.group()
        };
        // this.hud.group.alpha = 0;
        this.hud.group.visible = false;
        var textBox = this.getSpriteInfo(this.elements.hud.message.box);
        this.hud.textBox = game.add.image(textBox.x,textBox.y,textBox.key,0,this.hud.group);
        this.hud.textBox.visible = false;
        textBox = this.getBoundingBoxInfo(this.elements.hud.message.text.boundingBox);
        var textStyle = _.extend(config.textDefaults,
            this.elements.hud.message.text,
            {wordWrap:true, wordWrapWidth:textBox.w});
        
        // textStyle.wordWrap = true;
        // textStyle.wordWrap = true;
            
        // };
        // console.log(textBox);
        this.hud.text = game.add.text(textBox.x,textBox.y, "", textStyle,this.hud.group);
        this.hud.textBox.addChild(this.hud.text);

        if (this.elements.hud.name){
            var nameBox = this.getSpriteInfo(this.elements.hud.name.box);
            this.hud.nameBox = game.add.image(nameBox.x,nameBox.y,nameBox.key,0,this.hud.group);            
            this.hud.nameBox.visible = false;
            this.hud.textBox.addChild(this.hud.nameBox);
            var nameStyle = _.extend(config.textDefaults,this.elements.hud.name.text);
            this.hud.name = game.add.text(0,0, "", nameStyle,this.hud.group);
            this.hud.name.setTextBounds(0,0, this.hud.nameBox.width, this.hud.nameBox.height);   
            this.hud.nameBox.addChild(this.hud.name);
        }
        if (this.elements.hud.ctc) {
            var ctc = this.getSpriteInfo(this.elements.hud.ctc);
            this.hud.ctc = game.add.sprite(ctc.x,ctc.y,ctc.key);
            // this.clickToContinue.anchor.set(0.5);
            this.hud.ctc.visible = false;
            this.hud.textBox.addChild(this.hud.ctc);
        }
        this.buttons = this.initButtons(this.elements.hud.buttons,this.hud.group);   
    }

    this.initMenu = function(name,menu){
        this.menus[name] = {
            group: game.add.group()
        };
        // this.menus[name].group.alpha = 0;
        this.menus[name].group.visible = false;
        var sprite = this.getSpriteInfo(menu.background);
        this.menus[name].background = game.add.image(sprite.x,sprite.y,sprite.key,0,this.menus[name].group);
        if (menu.music){
            // console.log("adding music");
            this.menus[name].music = game.add.audio(menu.music);
            this.menus[name].music.onDecoded.add(function(){
                this.menus[name].music.ready = true;
            }, this);
        };
        _.each(menu.images,function(image,key){
            sprite = this.getSpriteInfo(image);
            this.menus[name][key] = game.add.image(sprite.x,sprite.y,sprite.key,0,this.menus[name].group);
        },this);

        this.menus[name].buttons = this.initButtons(menu.buttons,this.menus[name].group);
    }

    this.initButtons = function(buttonsMeta,group){
        var buttons = {};
        _.each(buttonsMeta,function(button,action){
            var btn = this.getSpriteInfo(button);
            // button(x, y, key, callback, callbackContext, overFrame, outFrame, downFrame, upFrame, group)
            buttons[action] = game.add.button(btn.x,btn.y,btn.key,this.buttonActions[action],this,0,1,0,1,group)
        },this);
        return buttons;
    }

    //quick menu actions
    this.buttonActions = {
        start: function(){
            RenJS.gui.hideMenu();
            RenJS.gui.showHUD();
            RenJS.storyManager.start();
        },
        load: function(){
            RenJS.gui.hideMenu();
            RenJS.gui.showHUD();
            RenJS.storyManager.load();
        },
        auto: RenJS.storyManager.autoplay,
        skip: RenJS.storyManager.skip,
        save: RenJS.storyManager.save,
        settings: function(){
            RenJS.gui.showMenu("settings");
        },
        return: function(){
            RenJS.gui.hideMenu();    
        }
        
    }

    //show menu
    this.showMenu = function(menu){
        RenJS.storyManager.pause();
        this.previousMenu = this.currentMenu;
        this.currentMenu = menu;
        this.menus[menu].group.visible = true;
        game.add.tween(this.menus[menu].group).to( {alpha:1}, 750,null,true);
        if (this.menus[menu].music){
            var music = this.menus[menu].music;
            if (music.ready){
                music.fadeIn(1000);    
            } else {
               setTimeout(function() {
                 music.fadeIn(1000);
               }, 1000); 
            }
            
        };        
    };

    //hide menu
    this.hideMenu = function(menu){  
        var menu = this.currentMenu;
        // console.log("hiding "+menu); 
        var tween = game.add.tween(this.menus[menu].group).to( {alpha:0}, 400);
        tween.onComplete.add(function(){
            this.menus[menu].group.visible = false;
            this.currentMenu = null;
            if (this.previousMenu){
                this.showMenu(this.previousMenu);   
            }
        },this);
        if (this.menus[menu].music && this.menus[menu].music.ready){
            this.menus[menu].music.fadeOut(400);
        };   
        tween.start();
        
    }

    //choice and interrupt buttons
    this.showChoices = function(choices){
        // this.hud.choices.boxes = []; 
        // this.hud.choices = {
        //     key: choiceSprite,
        //     w: dimensions.x,
        //     h: dimensions.y,
        //     style: choiceStyle,
        //     boxes: game.add.group()
        // }

        var yOffset = (choices.length*this.hud.choices.h)/2;
        _.each(choices,function(choice,index){
            console.log("Showing choice");
            console.log(choice);
            var y = game.world.centerY - yOffset + this.hud.choices.h*index;
            var choiceText = _.keys(choice)[0];
            var chBox = game.add.button(game.world.centerX, y, this.hud.choices.key, function(){
                RenJS.choiceManager.choose(index,choiceText);
            }, RenJS.choiceManager, 0,1,0,1,this.hud.choices.boxes);
            chBox.anchor.set(0.5,0);
            var chText = game.add.text(0,0, choiceText, this.hud.choices.style);
            chText.setTextBounds(-chBox.width/2,0, chBox.width, chBox.height);
            //chText.anchor.set(0.5,0.5);
            chBox.addChild(chText);
            // debugger;
            // this.choiceBoxes.push(chBox);            
        },this);
    }

    this.hideChoices = function(){
        this.hud.choices.boxes.removeAll(true);
    }

    this.showHUD = function(){
        this.hud.group.visible = true;
    }

    this.hideHUD = function(){
        this.hud.group.visible = false;
    }

    //dialogue and text
    this.showText = function(text,title,colour,callback){
        // console.log("Showing");
        if  (title && this.hud.nameBox) {            
            this.hud.name.clearColors();
            this.hud.name.addColor(colour,0);  
            this.hud.nameBox.visible = true; 
            this.hud.name.text = title;
        } else {
            this.hud.nameBox.visible = false; 
        }
        // if (this.hud.ctc){
        //     this.hud.ctc.visible = true;
        // }
        var textObj = this.hud.text
        textObj.text = "";
        var words = text.split(" ");
        var count = 0;
        var loop = setInterval(function(){
            if (count >= words.length-1){
                clearTimeout(loop);
                RenJS.gui.showCTC();
                callback();
            }            
            textObj.text += (words[count]+" ");
            count++;
        }, config.settings.textSpeed);
        // this.hud.group.visible = true;
        this.hud.textBox.visible = true;
        RenJS.storyManager.waitForClick(function(){
            clearTimeout(loop);
            textObj.text = text;
            RenJS.gui.showCTC();
            callback();
        });
    }

    this.hideText = function(){
        this.hud.textBox.visible = false;
        if (this.hud.ctc && this.hud.ctc.tween){
            this.hud.ctc.alpha = 0;
            this.hud.ctc.tween.stop();
        }
    }

    this.showCTC = function(){
        var ctc = RenJS.gui.hud.ctc;
        ctc.alpha = 0;
        ctc.visible = true;
        if (ctc) {
            ctc.tween = game.add.tween(ctc).to({ alpha: 1 }, 400, Phaser.Easing.Linear.None,true,0,-1);
        }
    }
}