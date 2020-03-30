import React from "react";
import ReactDOM from "react-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import './App.css';
import $ from 'jquery';
import fileDownload from 'js-file-download';
import mermaid from "mermaid";
import EventController from './controllers/EventController.js';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";







//import RdfController from './controllers/RdfController.js';
//import { thisTypeAnnotation } from "@babel/types";

//přiřadit key k talčítkům -> zamyslet se nad využitím 
class Layout extends React.Component {
  constructor(props) {
    super(props);



    this.eventController = new EventController();
    this.state = {
      svg: "", iframeURL: this.eventController.getIframeURL()
    };

    mermaid.initialize({
      startOnLoad: false,
      themeCSS: '#extensionEnd { fill: white; } #extensionStart { fill: white; }',
    });
  }

  createGraph = (svg) => {

    this.setState({ svg: svg });
  }

  render() {
    return (
      <div className="container">
        <div className="row">
          <div className="form-group col-md-6" id="graph">
            <label htmlFor="exampleFormControlTextarea1">Puro model</label>
            <div className="form-control  transformWindow embed-responsive" id="exampleFormControlTextarea1">
              <PuroModel iframeURL={this.state.iframeURL} />
            </div>
          </div>

          <div className="form-group col-md-6" id="graph">
            <TransformWrapper
              enablePadding={false}>
              {({ zoomIn, zoomOut, resetTransform, ...rest }) => (
                <React.Fragment>
                  <div className="tools">
                    <label htmlFor="exampleFormControlTextarea1">Onto model</label>
                    <button className="toolBtn btn-sm btn-light" onClick={resetTransform}>Unzoom</button>
                  </div>
                  <div className="border">
                    <TransformComponent>
                      <div dangerouslySetInnerHTML={{ __html: this.state.svg }} className="transformWindow" id="exampleFormControlTextarea1">
                      </div>
                    </TransformComponent>
                  </div>
                </React.Fragment>
              )}
            </TransformWrapper>
          </div>
          <QuestionPart graphCreation={this.createGraph} eventController={this.eventController} />
        </div>
      </div>
    );
  }

}



class PuroModel extends React.Component {

  // $("#iFrameId").contents().find("#yourDiv").empty();


  render() {
    return <iframe onLoad={this.loaded} id="iframePuro" className="embed-responsive-item" src={this.props.iframeURL}></iframe>;
  }


}


class QuestionPart extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      startTransform: true, originalName: "", nameWasChange: false,
      buttons: [], changeName: false, elName: "", type: "", undoActive: false, svg: ""
    };

    this.eventController = this.props.eventController;
  }

  handleChange = (event) => {
    this.setState({ elName: event.target.value });
  }

  handleSubmit = (event) => {
    if (event !== undefined) {
      event.preventDefault();
    }

    //window.addEventListener('unhandledrejection', function(event) {
    //alert("Rule is not defined!\nOnly the first answer is correct! \nRules are not complete yet!\nPage will be reloaded!");
    //window.location.reload(); 
    //});

    this.eventController.getDefault(true).then(results => {
      this.setState({ undoActive: false, svgUrl: "", buttons: results.buttons, title: results.title, originalName: results.originalName, type: results.type, startTransform: false });
    });

  }

  undoClick = () => {



  }




  handleClick = (selectedType, selectedUri, type) => {
    let elName = this.state.elName;
    let undo = false;
    let setState = true;
    let nameWasChange = this.state.nameWasChange;

    if ((elName === "" && this.state.changeName === true && type !== "Undo") && selectedType.toLowerCase() !== "none") {
      alert("Plese write name of the element!");
    }
    else if (elName !== "" && !elName.match(/^[A-Za-z0-9-_*<>]+$/)) {
      alert("Please change the name. It contains forbidden characters!");
    }
    else {
      if (type === "Undo") {

        const history = this.eventController.undo();
        if (history === false) {
          this.handleSubmit();
          setState = false;
        }
        else {
          const inputVariables = history.inputVariables;
          selectedType = inputVariables[0];
          selectedUri = inputVariables[1];
          type = inputVariables[2];
          elName = inputVariables[3];
          nameWasChange = inputVariables[4];

          undo = true;
        }

      }
      elName = elName.replace(/\s/g, '_');

      if (elName !== "" && this.state.changeName === true && !this.eventController.checkDuplicity(elName)) {
        alert("Element already exists! Please choose different name.")
      }
      else if (setState === true) {

        this.eventController.nextElement(selectedType, selectedUri, type, elName, nameWasChange).then(results => {

          if (undo === false) {
            let properties = (Object.getOwnPropertyNames(this.eventController));
            let historyRecord = {};
            for (let prop of properties) {
              if (!prop.includes("Controller") && prop !== "rulesJson" && prop !== "relations") {
                if (typeof prop !== 'function') {
                  historyRecord[prop] = this.assignProp(this.eventController[prop])
                }
              }
            }

            this.eventController.saveHistory(historyRecord, [selectedType, selectedUri, type, elName, this.state.nameWasChange]);
          }

          let svg = this.eventController.getGraphSvg();

          this.setState({ buttons: results.buttons, type: results.type, title: results.title, undoActive: true, elName: "", changeName: results.elName, originalName: results.originalName, nameWasChange: false });

          if (svg !== false) {
            this.createGraph(svg);
          }

          if (this.state.type.includes("end")) {
            this.handleDownloadImage();
          }

        });
      }
    }
  }



  assignProp = (prop) => {

    if (Array.isArray(prop) || typeof prop === 'object') {
      //how to 
      return JSON.parse(JSON.stringify(prop));
    }
    else {
      return prop;
    }

  }

  createGraph = (chart) => {

    const cb = svg => {
      this.setState({ svg: svg });
      this.props.graphCreation(svg);
    };
    mermaid.render('id1', chart, cb);
  }

  handleChangeName = () => {


    this.setState({ changeName: !this.state.changeName });
    if (this.state.changeName === true) {
      this.setState({ elName: "", nameWasChange: false });
      $(".changeAlert").fadeTo(1400, 500).slideUp(500, function () {
        $(".changeAlert").alert('fade');
      });
    }
    else {
      this.setState({ elName: "", nameWasChange: true });

    }
  }

  handleDownloadImage = () => {
    const svgBlob = new Blob([this.state.svg], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);
    this.setState({ svgUrl: svgUrl });

  }

  handleDownloadSchema = () => {
    const ontoSchema = JSON.stringify(this.eventController.getOntoSchema());
    fileDownload(ontoSchema, 'ontoSchema.json');
  }

  render() {
    return (
      <div className="container-fluid text-center questionPart">

        <button type="Submint" className={this.state.startTransform ? "btn btn-primary" : "d-none"} data-toggle="modal" data-target="#exampleModal" onClick={this.handleSubmit}>
          Start transformation
          </button>
        <div className={this.state.startTransform ? "d-none" : ""}>
          <h3 className="questionTitle">{this.state.title}</h3>
          <div className="optionButtons d-none d-md-block">
            <div className="btn-group-vertical text-right">
              <button type="button" className="btn btn-primary btnModal" onClick={this.handleChangeName} disabled={this.state.originalName === "" || this.state.type.includes("ontoRelation") || this.state.type.includes("end") || this.state.type === "nextBranchElements"}>{this.state.changeName === true && this.state.originalName !== "" ? "Set original name" : "Change name"}</button>
              <button type="button" className="btn btn-primary btnModal" onClick={() => this.handleClick(undefined, undefined, "Undo")} disabled={!this.state.undoActive}>Undo</button>
              <button type="button" className="btn btn-secondary btnModal" data-dismiss="modal" onClick={(e) => { if (window.confirm('Are you sure you want to cancel the transformation?')) window.location.reload(); }}>Cancel</button>
            </div>
          </div>
          <div className={this.state.changeName === true ? 'col-md-6 mx-auto' : 'd-none'}>
            <div className="input-group inputName">
              <div className="input-group-prepend">
                <span className="input-group-text" id="">Name of the element:</span>
              </div>
              <input placeholder={this.state.originalName === "" ? "Write name of the element!" : this.state.originalName} type="text" className="form-control" onChange={this.handleChange} value={this.state.elName}></input>
            </div>
            <h5 className={this.state.buttons.lenght > 1 ? "text-center inputName" : "d-none"}>Select element's class:</h5>
          </div>
          <div className="divButtons text-center">
            <TypeButtons buttons={this.state.buttons} onClickDownloadSchema={this.handleDownloadSchema} svgUrl={this.state.svgUrl} onClick={this.handleClick} type={this.state.type} elNames={this.state.changeName} originalName={this.state.originalName} />
          </div>
          <div class="alert alert-success col-md-6 mx-auto changeAlert" role="alert">
            Original name of the element was set!
        </div>
        </div>
      </div>
    );
  }

}

class TypeButtons extends React.Component {
  constructor(props) {
    super(props);
    this.refs = React.createRef();
  }


  render() {
    if (this.props.type.includes("ontoRelation-save")) {
      return (
        <div className="row col-md-5 mx-auto">
          <label className="label label-default col-md-6 mx-auto form-control">{this.props.elNames[0]}</label>
          <label className="label label-default col-md-6 mx-auto form-control">{this.props.elNames[1]}</label>
          <select ref="relFrom" className="col-md-6 mx-auto form-control cardinalitySelect">
            {this.props.buttons.filter((val) => {
              return val.direction === "from";
            }).map((rel) => {
              return <option value={rel.name}>{rel.name}</option>
            })}
          </select>

          <select ref="relTo" className="col-md-6 mx-auto form-control cardinalitySelect">
            {this.props.buttons.filter((val) => {
              return val.direction === "to";
            }).map((rel) => {
              return <option value={rel.name}>{rel.name}</option>
            })}
          </select>

          <button className="btn btn-success mx-auto questionPart" onClick={() => this.props.onClick([this.refs.relFrom.value, this.refs.relTo.value], null, this.props.type)}>Next</button>
        </div>
      )
    }
    else if (this.props.type.includes("end")) {
      return (
        <div className="col-md-8 mx-auto">
          <a className="btn btn-success btnEnd" href={this.props.svgUrl} download="ontoUml-graph.svg">Download Onto-UML graph</a>
          <button type="button" className="btn btn-success btnEnd" onClick={() => this.props.onClickDownloadSchema()}>Download Onto-Schema</button>
        </div>
      );
    }
    else {
      return (
        <div className="row col-md-6 mx-auto">
          {this.props.buttons.map((value) => {
            return <div className="col-md-4 mx-auto">
              <button key={this.props.uri} type="button" className={value.name.toLowerCase() === "none" ? " btn btn-secondary btnModal" : "btn btn-success btnModal"} onClick={() => this.props.onClick(value.name, value.uri, this.props.type, value.origin)} >{(this.props.type.includes("dataType") || (this.props.originalName === "" && this.props.buttons.length === 1) || (value.name.toLowerCase() === "relator" && this.props.buttons.length === 1)) ? "Next" : value.name}</button>
            </div>
          })}
        </div>
      )
    }

  }
}

class App extends React.Component {

  render() {
    return [<Layout />]

  }
}

ReactDOM.render(
  <App />,
  document.getElementById('root')
);

