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
            RenJS.tweenManager.current = [];
            tween.start();
            if (!config.settings.auto) {
                RenJS.storyManager.waitForClick(this.skip);    
            }            
        }
        RenJS.tweenManager.current.push(tween);
        // if (config.settings.skipping){
        //     this.skip();
        // }
        return tween;
    }

    this.chain = function(tweens,time){
        var tm = RenJS.tweenManager;
        tm.current = [];
        var lastTween = null;
        _.each(tweens,function(tween){
            var tween = tm.tween(tween.sprite,tween.tweenables,tween.callback,time/tweens.length,false);
            if (lastTween){
                lastTween.chain(tween);
            }
            lastTween = tween;
        },tm);
        tm.current[0].start();
        if (!config.settings.auto) {
            RenJS.storyManager.waitForClick(tm.skip);    
        }
    }

    this.parallel = function(tweens,time){
        var tm = RenJS.tweenManager;
        tm.current = [];
        _.each(tweens,function(tween){
            var tween = tm.tween(tween.sprite,tween.tweenables,tween.callback,time,false);
            tween.start();
        },tm);
        if (!config.settings.auto) {
            RenJS.storyManager.waitForClick(tm.skip);    
        }
    }

    this.skip = function(){
        // debugger;

        // console.log("skipping "+tweenManager.current.length);
        var tweens = RenJS.tweenManager.current;
        RenJS.tweenManager.current = [];
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

