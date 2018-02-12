import React, { Component } from 'react';
import {List, ListItem} from 'material-ui/List';
import Subheader from 'material-ui/Subheader';
import IconCheck from 'material-ui/svg-icons/toggle/check-box';
import IconCurrent from 'material-ui/svg-icons/toggle/indeterminate-check-box';
import IconFuture from 'material-ui/svg-icons/toggle/check-box-outline-blank';

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
        let leftIcon = <IconFuture/>;

        if (step.done) {
          leftIcon = <IconCheck/>;
        } else if (idx === this.props.currentStep) {
          leftIcon = <IconCurrent/>;
        }

        return <ListItem key={idx} leftIcon={leftIcon}>{step.description}</ListItem>;
      })}
      </List>;
  }
}
