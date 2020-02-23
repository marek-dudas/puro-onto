export default class Element {
    constructor (uri, label, father, child, connect) {
        this.uri = uri; 
        this.label = label; 
        this.father = father;
        this.child = child;
        this.connect = connect; 
        //z jaké funkce pochází; 
        this.origin = origin; 

    }

}