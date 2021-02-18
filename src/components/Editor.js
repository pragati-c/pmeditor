import React, { Component } from 'react';
import { EditorState } from "prosemirror-state"
import { EditorView } from "prosemirror-view"
import { Schema, DOMParser, Fragment } from "prosemirror-model"
import { schema } from "./Schema.js";
import { addListNodes } from "prosemirror-schema-list"
import { exampleSetup } from "prosemirror-example-setup"
import { keymap } from "prosemirror-keymap"
import { menuBar } from "prosemirror-menu"
import { buildMenuItems } from './Menu.js';
import axios from "axios";

import './style.css';

const mySchema = new Schema({
  nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
  marks: schema.spec.marks
});

const myPlugins = exampleSetup({ schema: mySchema, menuBar: false });

myPlugins.push(
  menuBar(
    {
      content: buildMenuItems(mySchema).fullMenu
    }
  )
);


myPlugins.push(keymap({
  "Shift-Ctrl-f": async (state, dispatch, view) => {
    let animals = await axios.get("https://json-only1.herokuapp.com/");
    view.dispatch(view.state.tr.replaceSelectionWith(mySchema.nodes.image.create(animals.data[Math.floor(Math.random() * animals.data.length)])))
    view.focus()
  }
}))
class AnimalDropdownView {
  constructor(node, view, getPos) {
    this.node = node
    this.outerView = view
    this.getPos = getPos




    let divDom = document.createElement("div")
    divDom.classList.add('animal-container');
    let animals = [{ "title": "Dog", "src": "http://s3.amazonaws.com/pix.iemoji.com/images/emoji/apple/ios-12/256/dog.png" }, { "title": "Cat", "src": "https://www.rspca.org.uk/webContent/staticImages/Infographics/CatHappy1.jpg" }, { "title": "Cow", "src": "https://open3dmodel.com/wp-content/uploads/2020/03/1584438450_Cow.jpg" }]

    divDom.innerHTML = '<div class="animal-list">' +
      animals
        .map(i => '<div class="animal-item" data-src="' + i.src + '">' + i.title + "</div>")
        .join("") +
      "</div>";

    divDom.querySelectorAll(".animal-item").forEach(function (itemNode, index) {
      if (index == 0) {
        itemNode.classList.add('selected-animal')
      }
      itemNode.addEventListener("click", function () {
        let animalData = animals.find(row => row.title == itemNode.innerHTML);
        let { $from, $to } = view.state.selection;
        let $position = view.state.tr.selection.$from
        const text = $position.doc.textBetween($position.before(), $position.pos, "\n", "\0");
       
        view.dispatch(view.state.tr.replaceSelectionWith(mySchema.nodes.image.create(animalData)))

        // view.focus();
      });
    });
    this.dom = divDom
    this.dom.focus();
    this.innerView = null
  }


  stopEvent(event) {
    return this.innerView && this.innerView.dom.contains(event.target)
  }

  ignoreMutation() { return true }
}

class ImageView {
  constructor(node) {
    this.dom = document.createElement("img")
    this.dom.src = node.attrs.src
  }
  stopEvent() { return true }
}

class Editor extends Component {
  constructor() {
    super();
    this.state = {
      name: 'React',
      editorView: null
    };
  }
  componentDidMount() {
    let view = new EditorView(this.editor, {
      state: EditorState.create({
        doc: DOMParser.fromSchema(mySchema).parse(this.content),
        plugins: myPlugins
      }),
      dispatchTransaction(transaction) {
        let newState = view.state.apply(transaction);
        view.updateState(newState)
      },
      nodeViews: {
        image(node, nodeView, getPos) { console.log(getPos); return new ImageView(node) },
        animaldropdown(node, view, getPos) { return new AnimalDropdownView(node, view, getPos) },

      },
      handlePaste: (view, event, slice) => { console.log(event) },
      handleKeyDown: (view, e, pos) => {
        console.log('keydown', pos)
        let { empty, $from, $to } = view.state.selection, content = Fragment.empty
        // console.log($from, $to)
        // if (!empty && $from.sameParent($to) && $from.parent.inlineContent)
        content = $from.parent.content.content && $from.parent.content.content.find(rowContent => rowContent.type.name == "animaldropdown")

        if (document.querySelector('.selected-animal')) {
          let active = document.querySelector('.selected-animal')
          let parentDiv = document.querySelector('.animal-list')
          if (e.keyCode == 40) {
            if (active.nextSibling)
              active.nextSibling.classList.add('selected-animal')
            else
              parentDiv.firstChild.classList.add('selected-animal')

            active.classList.remove('selected-animal')
          } else if (e.keyCode == 38) {
            if (active.previousSibling)
              active.previousSibling.classList.add('selected-animal')
            else
              parentDiv.lastChild.classList.add('selected-animal')

            active.classList.remove('selected-animal')
          }

          if (e.keyCode == 13) {
            console.log(active.dataset.src);
            let animalData = {
              src: active.dataset.src,
              title: active.innerHTML
            }
            view.dispatch(view.state.tr.replaceSelectionWith(mySchema.nodes.image.create(animalData)))
            document.querySelector('.animal-container').remove();
            // view.dispatch(mySchema.nodes.footnote.update());
            view.focus();
          }

        }
      },
      handleKeyPress: (view) => {

        let { empty, $from, $to } = view.state.selection, content = Fragment.empty

        content = $from.parent.content.content && $from.parent.content.content.find(rowContent => rowContent.type.name == "footnote")
        console.log('content', $from, $to)

        if (!document.querySelector('.animal-list')) {
          view.dispatch(view.state.tr.insert(view.state.tr.doc.content.size, mySchema.nodes.animaldropdown.create()));
          view.focus()
        }


      }
    });

    this.setState({ editorView: view })
  }

  render() {
    return (
      <div style={{ width: 800, height: 450, margin: "0px auto", border: "1px solid silver" }} ref={r => this.editor = r}>
        <div ref={r => this.content = r} />
      </div>
    );
  }
}

export default Editor