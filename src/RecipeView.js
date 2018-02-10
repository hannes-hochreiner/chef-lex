import React, { Component } from 'react';
import {List, ListItem} from 'material-ui/List';
import Subheader from 'material-ui/Subheader';

export default class RecipeView extends Component {
  render() {
    if (!this.props.recipe) {
      return <p>recipe not found</p>;
    }

    return <List style={{'width': '500px'}}>
      <Subheader>ingredients</Subheader>
      {this.props.recipe.ingredients.map((ingr, idx) => {
        return <ListItem key={idx}>{ingr.title}</ListItem>;
      })}
      <Subheader>steps</Subheader>
      {this.props.recipe.steps.map((step, idx) => {
        return <ListItem key={idx}>{step.description}</ListItem>;
      })}
      </List>;
  }
}
