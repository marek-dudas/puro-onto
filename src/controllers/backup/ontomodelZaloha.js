export default class RuleController {


    constructor ()
    {
        this.ontoModel  = []; 
    } 
    // selected co se zvolilo, elemnt 
    addToOntoModel = (selected, element,rule,  ruleIndex, elementOrigin) => 
    {
    
        if (element === "new")
        {

                let from = rule[ruleIndex -1].from ;
                let to = rule[ruleIndex -1].to ;

                from = this.ontoModel[this.ontoModel.length + from].uri;
                to  = this.ontoModel[this.ontoModel.length + to].uri;
                this.ontoModel.push({uri: "", label: "NAME", from: from, to: to, ontoType: selected, puroType: null});

                return true; 
        }
        // let lement bes

        var label  = element.label.value; 
        var puroType = element.type.value.split('#')[1];
        var relation = "";
        var father = []; 
        var fromOnto = "";
        var linkedTo = 0;
        var question = "";
        if ('relation' in element) {
           relation = element.relation.value.split('#')[1];
        }
        // problém v případě dvou otců.. 
       
        if ('father' in element) {
            // !!blbost puro father není onto father
            father = element.father[0];
        }
        
        if ('connect' in element && element.connect !== [] && element.connect !== null) {
            linkedTo = element.connect.length;
        }

        //bacha na index možná bude jinak
        fromOnto = this.getFatherOntoType(element);
        // ještě dopň vztahy
        this.ontoModel.push({uri: element.uri.value, label: label, fromP: father, ontoType: selected, puroType: puroType, origin: elementOrigin});
        console.log(this.ontoModel);
        return true; 
    }



    getOntoModel = () =>
    {
        return this.ontoModel; 
    }
    




    getElementOntoType = (uri) => 
    {
        let ontoType = false; 
        
        let element = this.getOntoElement(uri);

        if (element === false)
        {
            return false;
        }
        else
        {
            return element.ontoType; 
        }

    }

    getElementsByOntoType = (type) => 
    {
       let result = [];

       for (let node of this.ontoModel)
       {
            if (type === node.ontoType)
            {
                result.push(node.uri);
            }
       }

       return result; 

    }

    getOntoElement = (uri) => 
    {
        for (let node of this.ontoModel)
        {
            if (node.uri === uri) 
            {
                return node; 
        
            }
        }
        return false;
    }

    changeOrigin = (uri, origin) => 
    {
       for (let i = 0; i < this.ontoModel.length; i++)   
       {
         if (this.ontoModel[i].uri === uri) {
             this.ontoModel[i].origin = origin; 
             return true;
         }
       }
       return false; 
    }

    getLastElementUri = (origin) => 
    {
        var uri; 
        for (let i = this.ontoModel.length - 1; i >= 0; i--) 
        {
            if (this.ontoModel[i].origin === origin)
            {
                uri = this.ontoModel[i].uri;
                return uri; 
            }
            
        }

        return false; 
    }

    getFatherOntoType = (element) => 
    {

        let result = []; 
        if ('father' in element)
        {
            for (let node of this.ontoModel)
            {
                if(element.father.includes(node.uri))
                {
                    result.push(node.ontoType);
                }
            }
        }

        if(result.length === 0)
        {
            result = [""];
        }
        return result;
    }





}

