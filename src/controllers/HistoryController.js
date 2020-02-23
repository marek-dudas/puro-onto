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

    reset ()
    {
        this.ontoModelHistory = [];
        this.propertiesHistory = []; 
        this.inputVariables = [];
    }

    saveRecords (properties = {}, ontoModel = [], inputVariables)
    {
        this.propertiesHistory.push(properties);
        this.ontoModelHistory.push(ontoModel);
        this.inputVariables.push(inputVariables); 
    }


    undo()
    {   
        
        this.ontoModelHistory.pop();
        const lastProp = this.propertiesHistory.pop();
        this.inputVariables.pop(); 
        if (this.propertiesHistory[this.propertiesHistory.length-2] !== undefined && this.propertiesHistory[this.propertiesHistory.length-2]["queryTree"].length === 0)
        {
            this.propertiesHistory[this.propertiesHistory.length-2]["queryTree"] = JSON.parse(JSON.stringify(lastProp["queryTree"]));
        }
        console.log(this.propertiesHistory)
        console.log(this.inputVariables)
        console.log(this.ontoModelHistory)
        return {ontoModel: this.ontoModelHistory[this.ontoModelHistory.length-2], properties: this.propertiesHistory[this.propertiesHistory.length-2],
        inputVariables: this.inputVariables[this.inputVariables.length-1]};
    }

}
