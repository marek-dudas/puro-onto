import $ from 'jquery';
export default class MainController{
    
    constructor()
    {
        
        let jsonData;
        $.ajax({
            type: "GET",
            url: "rules.json",
            async: false,
            cache: false,
            dataType: "json",
            success: function(json) {
                jsonData = json;
            }
        });

        this.rulesJson = JSON.parse(JSON.stringify(jsonData)); 
        this.ontoUri = "http://lod2-dev.vse.cz/data/ontomodels#";
    }
    // orgin lze držet jako property objektu 
    // uri lze držet v property objektu 
    createButtons (buttons, title, type, elName, origName = "") 
    {
        
        
        //"uri": unfinishedTypes[0].element
        buttons = !Array.isArray(buttons)? [buttons] : buttons;
        const mapButtons = buttons.map(buttonType => {
            return {name: buttonType};
        });
     

        return Promise.resolve({buttons: mapButtons, title: title, type: type, elName: elName, originalName: origName}); 
    }

    createQuestion (unfinishedType, questions) 
    {
        let question = "";
        if ("question" in unfinishedType.rule)
        {
            for (let q of questions)
            {
                
                if (q.type === unfinishedType.rule.question)
                {
                    question = q.question;
                    break;
                    
                }
            }
            question = (question === "") ? unfinishedType.rule.question : question; 
            let qType = (unfinishedType.key in unfinishedType.rule) ? unfinishedType.rule[unfinishedType.key][0] : unfinishedType.rule.type[0];
            return question.replace("VAL", this.delUri(unfinishedType.element)).replace("TYPE",qType); 
        }
        else
        {
            const preposition = this.isSameCaseInsensitive(unfinishedType.key, "connect") ? " to " : " of ";
            return "What is " + unfinishedType.key + preposition + this.delUri(unfinishedType.element)+"?";
        }

    }

    countBTypesInTree(tree)
    {
        let index = 0; 
        for (let node of tree)
        {
            if (this.delUri(node.type.value) === "BType" && !node.fatherTypeRelation.includes("http://lod2-dev.vse.cz/ontology/puro#instanceOf"))
            {
                index ++; 
            }
        }

        return index; 
    }
   
   
    delUri (uri) 
    {
        var result = []; 
        if (typeof uri === 'string')
        {
            return uri.split('#')[1];
        }
        else if (Array.isArray(uri))
        {
            for(let element of uri)
            {
                result.push(element.split('#')[1]);
            }
            return result; 
        }
        else
        {
            return "";
        }
        
    }
     getKeyByValue(object, value) {
        return Object.keys(object).find(key => object[key] === value);
      }

    isSameCaseInsensitive(text, other) {
        return text.localeCompare(other, undefined, { sensitivity: 'base' }) === 0;
    }


}