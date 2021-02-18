import { undoItem, redoItem, MenuItem } from "prosemirror-menu"


import axios from "axios";

// Helpers to create specific types of items

function animalItem(nodeType) {
  return new MenuItem({
    title: "Add or remove Animal",
    label: "Animal",
    run: async (state, dispatch, view) => {
      let animals = await axios.get("https://json-only1.herokuapp.com/");
      view.dispatch(view.state.tr.replaceSelectionWith(nodeType.schema.nodes.image.create(animals.data[Math.floor(Math.random() * animals.data.length)])))
      view.focus()
    }
  })
}


export function buildMenuItems(schema) {
  let r = {}, type

  if (type = schema.nodes.animal)
    r.animalMenu = animalItem(type)

  r.fullMenu = [[r.animalMenu, undoItem, redoItem]]

  return r
}