export default class MainController{

   
   
   
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

    createQuestion (unfinnishedType, questions) 
    {
        let question = "";
                        
        if ("question" in unfinnishedType)
        {
            for (let q of questions)
            {
                if (q.type === unfinnishedType.question)
                {
                    return q.question;
                    
                }
            }
            question = (question === "") ? unfinnishedType.question : question; 
            let qType = (unfinnishedType.key in unfinnishedType.rule) ? unfinnishedType.rule[unfinnishedType.key][0] : unfinnishedType.rule.type[0];
            return question.replace("VAL", this.delUri(unfinnishedType.element)).replace("TyPe",qType); 
        }
        else
        {
            return "What is " + unfinnishedType.key + " of " + this.delUri(unfinnishedType.element);
        }

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


}