import React, { ReactNode, useCallback, useContext, useEffect, useMemo } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { filter } from 'lodash';
import { NetInfoStateType } from '@react-native-community/netinfo';
import { useSelector } from 'react-redux';
import { t } from 'ttag';

import useNetworkStatus from '@components/core/useNetworkStatus';
import { CampaignId, Deck } from '@actions/types';
import Card from '@data/types/Card';
import DeckListComponent from '@components/decklist/DeckListComponent';
import withLoginState, { LoginStateProps } from '@components/core/withLoginState';
import COLORS from '@styles/colors';
import space, { s, xs } from '@styles/space';
import { getDeckToCampaignMap } from '@reducers';
import StyleContext from '@styles/StyleContext';
import { SearchOptions } from '@components/core/CollapsibleSearchBox';
import { SEARCH_BAR_HEIGHT } from '@components/core/SearchBox';
import RoundedFactionBlock from '@components/core/RoundedFactionBlock';
import DeckSectionHeader from '@components/deck/section/DeckSectionHeader';
import RoundedFooterButton from '@components/core/RoundedFooterButton';
import { useMyDecks } from '@data/hooks';
import MiniDeckT from '@data/interfaces/MiniDeckT';

interface OwnProps {
  componentId: string;
  deckClicked: (deck: Deck, investigator: Card | undefined, campaign: CampaignId | undefined) => void;
  onlyDecks?: MiniDeckT[];
  filterDeck?: (deck: MiniDeckT) => boolean;
  searchOptions?: SearchOptions;
  customFooter?: ReactNode;
}

type Props = OwnProps & LoginStateProps;

function MyDecksComponent({
  deckClicked,
  onlyDecks,
  filterDeck,
  searchOptions,
  customFooter,
  login,
  signedIn,
  deckActions,
}: Props) {
  const [{ networkType, isConnected }] = useNetworkStatus();
  const { typography, width } = useContext(StyleContext);
  const reLogin = useCallback(() => {
    login();
  }, [login]);
  const deckToCampaign = useSelector(getDeckToCampaignMap);
  const [{
    myDecks,
    myDecksUpdated,
    refreshing,
    error,
  }, onRefresh] = useMyDecks(deckActions);


  useEffect(() => {
    const now = new Date();
    if ((!myDecks ||
      myDecks.length === 0 ||
      !myDecksUpdated ||
      (myDecksUpdated.getTime() / 1000 + 600) < (now.getTime() / 1000)
    ) && signedIn) {
      onRefresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const errorLine = useMemo(() => {
    if (!error && networkType !== NetInfoStateType.none) {
      return null;
    }
    if (!isConnected || networkType === NetInfoStateType.none) {
      return (
        <View style={[styles.banner, styles.warning, { width }]}>
          <Text style={typography.small}>
            { t`Unable to update: you appear to be offline.` }
          </Text>
        </View>
      );
    }
    if (error === 'badAccessToken') {
      return (
        <TouchableOpacity onPress={reLogin} style={[styles.banner, styles.error, { width }]}>
          <Text style={[typography.small, styles.errorText, space.paddingS]}>
            { t`We're having trouble updating your decks at this time. If the problem persists tap here to reauthorize.` }
          </Text>
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity onPress={reLogin} style={[styles.banner, styles.error, { width }]}>
        <Text style={[typography.small, styles.errorText, space.paddingS]}>
          { t`An unexpected error occurred (${error}). If restarting the app doesn't fix the problem, tap here to reauthorize.` }
        </Text>
      </TouchableOpacity>
    );
  }, [error, networkType, isConnected, width, typography, reLogin]);

  const signInFooter = useMemo(() => {
    if (signedIn) {
      return null;
    }
    return (
      <View style={styles.signInFooter}>
        <RoundedFactionBlock
          header={<DeckSectionHeader title={t`ArkhamDB Account`} faction="neutral" />}
          footer={<RoundedFooterButton
            icon="world"
            title={t`Connect to ArkhamDB`}
            onPress={login}
          />}
          faction="neutral"
        >
          <View style={space.paddingS}>
            <Text style={typography.text}>
              { t`ArkhamDB is a popular deck building site where you can manage and share decks with others.\n\nSign in to access your decks or share decks you have created with others.` }
            </Text>
          </View>
        </RoundedFactionBlock>
      </View>
    );
  }, [login, signedIn, typography]);

  const footer = useMemo(() => {
    return (
      <View style={styles.footer}>
        { !!customFooter && <View style={styles.row}>{ customFooter }</View> }
        { signInFooter }
      </View>
    );
  }, [customFooter, signInFooter]);

  const header = useMemo(() => {
    const searchPadding = !!searchOptions && Platform.OS === 'android';
    if (!errorLine && !searchPadding) {
      return null;
    }
    return (
      <>
        { !!errorLine && (
          <View style={styles.stack}>
            { errorLine }
          </View>
        ) }
        { searchPadding && <View style={styles.searchBarPlaceholder} /> }
      </>
    );
  }, [searchOptions, errorLine]);

  const deckIds = useMemo(() => {
    return filter(onlyDecks || myDecks, deckId => !filterDeck || filterDeck(deckId));
  }, [filterDeck, onlyDecks, myDecks]);
  return (
    <DeckListComponent
      searchOptions={searchOptions}
      customHeader={header}
      customFooter={footer}
      deckIds={deckIds}
      deckClicked={deckClicked}
      deckToCampaign={deckToCampaign}
      onRefresh={signedIn ? onRefresh : undefined}
      refreshing={refreshing}
      isEmpty={myDecks.length === 0}
    />
  );
}

export default withLoginState<OwnProps>(MyDecksComponent);

const styles = StyleSheet.create({
  stack: {
    flexDirection: 'column',
  },
  banner: {
    paddingTop: xs,
    paddingBottom: xs,
    paddingLeft: s,
    paddingRight: s,
  },
  error: {
    backgroundColor: COLORS.red,
  },
  warning: {
    backgroundColor: COLORS.yellow,
  },
  errorText: {
    color: COLORS.white,
  },
  signInFooter: {
    padding: s,
    paddingTop: 0,
  },
  footer: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  searchBarPlaceholder: {
    height: SEARCH_BAR_HEIGHT,
  },
});
