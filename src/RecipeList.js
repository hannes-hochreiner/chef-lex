import React, { Component } from 'react';
import {List, ListItem} from 'material-ui/List';
import Subheader from 'material-ui/Subheader';

export default class RecipeList extends Component {
  render() {
    if (!this.props.recipes) {
      return <p>no recipes found</p>;
    }

    return <List style={{'width': '500px'}}>
      <Subheader>available recipes</Subheader>
      {Object.keys(this.props.recipes).map(key => {
        return <ListItem key={key}>{key}</ListItem>;
      })}
      </List>;
  }
}
