function LogicManager(){

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
        RenJS.resolve();
    }

    this.evalExpression = function(expression){
        expression = expression+"";
        expression = this.parseVars(expression);
        try {
            return eval(expression);
        } catch(e) {
            console.log("couldn-t eval");
            return false;
        }
    }

    this.branch = function(expression,branches){
        var val = this.evalExpression(expression);
            // debugger;
        if (val && branches.ISTRUE){
            var actions = branches.ISTRUE;
            RenJS.storyManager.currentScene = _.union(actions,RenJS.storyManager.currentScene);
            
        } 
        if (!val && branches.ISFALSE){
            RenJS.control.execStack[0].c++;
            var actions = branches.ISFALSE;
            RenJS.storyManager.currentScene = _.union(actions,RenJS.storyManager.currentScene);

        }
        RenJS.control.execStack.unshift({c:-1,total:actions.length,action: "if"});
        RenJS.resolve();
    }

    this.parseVars = function(text){
        var vars = text.match(/\{(.*?)\}/g);
        if (vars) {
            _.each(vars,function(v){
                var varName = v.substring(1,v.length-1);this.evalExpression
                text = text.replace(v,this.vars[varName]);
            },this);
        }
        return text;
    }

    this.evalChoice = function(choice){
        var choiceText = _.keys(choice)[0];
        var params = choiceText.split("!if");
        if (params.length > 1){
            var val = RenJS.logicManager.evalExpression(params[1]);
            if (val) {
                var next = choice[choiceText];
                delete choice[choiceText];
                choice[params[0]] = next;
            }
            return val;
        }
        return true; //unconditional choice
    }

    this.showChoices = function(choices){
        var ch = _.map(choices,_.clone);
        ch = _.filter(ch,this.evalChoice);
        RenJS.logicManager.currentChoices = ch;     
        RenJS.gui.showChoices(ch); 
        if (RenJS.logicManager.interrupting){
            RenJS.control.execStack[0].interrupting = RenJS.control.execStack[0].c;
            RenJS.resolve();
        }
    }

    this.choose = function(index,chosenOption){
        RenJS.gui.hideChoices();
        if (chosenOption){
            var actions = RenJS.logicManager.currentChoices[index][chosenOption];
            RenJS.storyManager.currentScene = _.union(actions,RenJS.storyManager.currentScene);
            RenJS.control.execStack.unshift({c:-1,index:index,op:chosenOption,total:actions.length,action:"choice"});
        }
        if (RenJS.logicManager.interrupting){
            RenJS.control.execStack[0].action = "interrupt";
            RenJS.logicManager.interrupting = false;
        } else {
            RenJS.resolve();
        }
    }
}

