
import React from 'react';
import { StyleSheet, Text, View } from 'react-native'
import { upperFirst, map } from 'lodash';

import CampaignLogCardEntryComponent from './CampaignLogCardEntryComponent';
import TextEntryComponent from './TextEntryComponent';
import CampaignGuide from 'data/scenario/CampaignGuide';
import { EntrySection, CampaignLogEntry } from 'data/scenario/GuidedCampaignLog';
import typography from 'styles/typography';

interface Props {
  sectionId: string;
  campaignGuide: CampaignGuide;
  section: EntrySection;
}

export default class CampaignLogSectionComponent extends React.Component<Props> {
  renderEntry(entry: CampaignLogEntry) {
    const { section } = this.props;
    const { campaignGuide, sectionId } = this.props;
    const logEntry = campaignGuide.logEntry(sectionId, entry.id);
    const crossedOut = section.crossedOut[entry.id];
    switch (logEntry.type) {
      case 'supplies': {
        if (entry.type !== 'count') {
          return null;
        }
        if (logEntry.supply.multiple) {
          if (entry.count === 0) {
            return null;
          }
          return (
            <TextEntryComponent
              text={`${logEntry.supply.name}: ${entry.count}`}
            />
          );
        }
        return (
          <TextEntryComponent
            text={logEntry.supply.name}
            crossedOut={crossedOut}
          />
        );
      }
      case 'text':
        return (
          <TextEntryComponent
            text={logEntry.text}
            crossedOut={crossedOut}
          />
        );
      case 'section_count':
        return (
          <Text>section count</Text>
        );
      case 'card':
        return (
          <CampaignLogCardEntryComponent
            entry={logEntry}
            crossedOut={crossedOut}
          />
        );
    }
  }

  render() {
    const { section } = this.props;
    return map(section.entries, (entry, idx) => (
      <View key={`${entry.id}_${idx}`}>
        { this.renderEntry(entry) }
      </View>
    ))
  }
}

const styles = StyleSheet.create({
  text: {
    marginBottom: 8,
  },
  crossedOut: {
    textDecorationLine: 'line-through',
  },
});
