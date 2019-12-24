import EventController from "./EventController";

export default class HistoryController {
    constructor ()
    {
        this.ontoModelHistory = [];
        this.propertiesHistory = []; 
        this.inputVariables = [];
    }

    init (rec)
    {
         this.propertiesHistory.push(rec);
         this.ontoModelHistory.push([]); 
    }

    





    saveRecords (properties = {}, ontoModel, inputVariables)
    {
        this.propertiesHistory.push(properties);
        this.ontoModelHistory.push(ontoModel);
        this.inputVariables.push(inputVariables); 
        console.log(this.ontoModelHistory);
    }

    undo()
    {   
        
        this.ontoModelHistory.pop();
        this.propertiesHistory.pop();
        this.inputVariables.pop(); 
        console.log(this.inputVariables)
        console.log(this.ontoModelHistory)
        return {ontoModel: this.ontoModelHistory[this.ontoModelHistory.length-2], properties: this.propertiesHistory[this.propertiesHistory.length-2],
        inputVariables: this.inputVariables[this.inputVariables.length-1]};
    }

}
