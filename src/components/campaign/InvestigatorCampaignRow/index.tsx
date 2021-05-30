import React, { useCallback, useContext, useMemo, useRef } from 'react';
import { Animated, Easing, View, StyleSheet } from 'react-native';
import { find , map } from 'lodash';
import Collapsible from 'react-native-collapsible';
import { t } from 'ttag';
import { useSelector } from 'react-redux';

import { showCard, showDeckModal } from '@components/nav/helper';
import CardSearchResult from '@components/cardlist/CardSearchResult';
import { Deck, TraumaAndCardData } from '@actions/types';
import { BODY_OF_A_YITHIAN } from '@app_constants';
import Card, { CardsMap } from '@data/types/Card';
import StyleContext from '@styles/StyleContext';
import useSingleCard from '@components/card/useSingleCard';
import LoadingCardSearchResult from '@components/cardlist/LoadingCardSearchResult';
import space, { s } from '@styles/space';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { useEffectUpdate, useFlag } from '@components/core/hooks';
import AppIcon from '@icons/AppIcon';
import MiniPickerStyleButton from '@components/deck/controls/MiniPickerStyleButton';
import TraumaSummary from '../TraumaSummary';
import RoundedFooterDoubleButton from '@components/core/RoundedFooterDoubleButton';
import DeckSlotHeader from '@components/deck/section/DeckSlotHeader';
import useXpSection from './useXpSection';
import MiniCampaignT from '@data/interfaces/MiniCampaignT';
import LatestDeckT from '@data/interfaces/LatestDeckT';
import ArkhamCardsAuthContext from '@lib/ArkhamCardsAuthContext';
import RoundedFooterButton from '@components/core/RoundedFooterButton';
import { AppState, makeUploadingDeckSelector } from '@reducers';
import CompactInvestigatorRow from '@components/core/CompactInvestigatorRow';

interface Props {
  componentId: string;
  campaign: MiniCampaignT;
  investigator: Card;
  spentXp: number;
  totalXp: number;
  unspentXp: number;
  traumaAndCardData: TraumaAndCardData;
  playerCards: CardsMap;
  chooseDeckForInvestigator?: (investigator: Card) => void;
  deck?: LatestDeckT;
  showXpDialog: (investigator: Card) => void;
  removeInvestigator?: (investigator: Card) => void;
  // For legacy system
  showDeckUpgrade?: (investigator: Card, deck: Deck) => void;
  showTraumaDialog?: (investigator: Card, traumaData: TraumaAndCardData) => void;
  miniButtons?: React.ReactNode;

  children?: React.ReactNode;
}

function StoryAssetRow({ code, onCardPress, last }: { code: string; last: boolean; onCardPress: (card: Card) => void }) {
  const [card, loading] = useSingleCard(code, 'player');
  if (loading || !card) {
    return <LoadingCardSearchResult />;
  }
  return (
    <CardSearchResult
      key={card.code}
      onPress={onCardPress}
      card={card}
      noBorder={last}
    />
  );
}

export default function InvestigatorCampaignRow({
  componentId,
  campaign,
  investigator,
  spentXp,
  totalXp,
  unspentXp,
  traumaAndCardData,
  playerCards,
  deck,
  children,
  miniButtons,
  showXpDialog,
  chooseDeckForInvestigator,
  removeInvestigator,
  showDeckUpgrade,
  showTraumaDialog,
}: Props) {
  const uploadingSelector = useMemo(makeUploadingDeckSelector, []);
  const uploading = useSelector((state: AppState) => uploadingSelector(state, campaign.id, investigator.code));
  const { colors, width } = useContext(StyleContext);
  const { userId } = useContext(ArkhamCardsAuthContext);
  const onCardPress = useCallback((card: Card) => {
    showCard(componentId, card.code, card, colors, true);
  }, [componentId, colors]);
  const eliminated = useMemo(() => investigator.eliminated(traumaAndCardData), [investigator, traumaAndCardData]);

  const editXpPressed = useCallback(() => {
    showXpDialog(investigator);
  }, [showXpDialog, investigator]);
  const canRemoveDeck = !deck?.owner || (userId && deck.owner.id === userId);

  const [xpButton, upgradeBadge] = useXpSection({
    deck,
    campaign,
    cards: playerCards,
    investigator,
    last: !miniButtons,
    totalXp,
    spentXp,
    unspentXp,
    uploading,
    isDeckOwner: !!canRemoveDeck,
    showDeckUpgrade,
    editXpPressed,
  });

  const onTraumaPress = useCallback(() => {
    if (showTraumaDialog) {
      showTraumaDialog(investigator, traumaAndCardData);
    }
  }, [traumaAndCardData, investigator, showTraumaDialog]);

  const storyAssetSection = useMemo(() => {
    const storyAssets = traumaAndCardData.storyAssets || [];
    if (!storyAssets.length) {
      return null;
    }
    return (
      <View style={space.paddingBottomS}>
        <DeckSlotHeader title={t`Campaign cards`} first />
        { map(storyAssets, (asset, idx) => (
          <StoryAssetRow key={asset} code={asset} onCardPress={onCardPress} last={idx === storyAssets.length - 1} />
        )) }
      </View>
    );
  }, [traumaAndCardData, onCardPress]);

  const removePressed = useCallback(() => {
    if (removeInvestigator) {
      removeInvestigator(investigator);
    }
  }, [investigator, removeInvestigator]);

  const viewDeck = useCallback(() => {
    if (deck) {
      showDeckModal(
        deck.id,
        deck.deck,
        campaign?.id,
        colors,
        investigator,
      );
    }
  }, [campaign, investigator, deck, colors]);

  const selectDeck = useCallback(() => {
    chooseDeckForInvestigator && chooseDeckForInvestigator(investigator);
  }, [investigator, chooseDeckForInvestigator]);

  const yithian = useMemo(() => !!find(traumaAndCardData.storyAssets || [], asset => asset === BODY_OF_A_YITHIAN), [traumaAndCardData.storyAssets]);
  const [open, toggleOpen] = useFlag(false);
  const openAnim = useRef(new Animated.Value(0));
  useEffectUpdate(() => {
    Animated.timing(
      openAnim.current,
      {
        toValue: open ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
        easing: Easing.ease,
      }
    ).start();
  }, [open]);
  const iconRotate = openAnim.current.interpolate({
    inputRange: [0, 1],
    outputRange: ['-90deg', '-180deg'],
    extrapolate: 'clamp',
  });
  const footerButton = useMemo(() => {
    if (uploading) {
      return (
        <RoundedFooterButton
          icon="spinner"
          title={t`Uploading...`}
        />
      );
    }
    if (deck && !canRemoveDeck) {
      return (
        <RoundedFooterButton
          onPress={viewDeck}
          icon="deck"
          title={t`View deck`}
        />
      );
    }
    return (
      <RoundedFooterDoubleButton
        onPressA={deck ? viewDeck : selectDeck}
        iconA="deck"
        titleA={deck ? t`View deck` : t`Select deck`}
        onPressB={removePressed}
        iconB="dismiss"
        titleB={deck ? t`Remove deck` : t`Remove`}
      />
    )
  }, [uploading, deck, canRemoveDeck, viewDeck, selectDeck, removePressed]);
  return (
    <View style={space.marginBottomS}>
      <TouchableWithoutFeedback onPress={toggleOpen}>
        <CompactInvestigatorRow
          investigator={investigator}
          eliminated={eliminated}
          yithian={yithian}
          open={open}
          upgradeBadge={upgradeBadge}
          width={width - s * 2}
        >
          { !open && <View style={styles.trauma}><TraumaSummary trauma={traumaAndCardData} investigator={investigator} whiteText /></View> }
          <Animated.View style={{ width: 36, height: 36, transform: [{ rotate: iconRotate }] }}>
            <AppIcon name="expand_less" size={36} color="#FFF" />
          </Animated.View>
        </CompactInvestigatorRow>
      </TouchableWithoutFeedback>
      <Collapsible collapsed={!open}>
        <View style={[
          styles.block,
          {
            borderColor: colors.faction[investigator.factionCode()].background,
            backgroundColor: colors.background,
          },
          space.paddingTopS,
        ]}>
          <View style={[space.paddingSideS]}>
            <View style={space.paddingBottomS}>
              <MiniPickerStyleButton
                title={t`Trauma`}
                valueLabel={<TraumaSummary trauma={traumaAndCardData} investigator={investigator} />}
                first
                last={!xpButton && !miniButtons}
                editable={!!showTraumaDialog}
                onPress={onTraumaPress}
              />
              { xpButton }
              { !!miniButtons && miniButtons }
            </View>
            { eliminated ? undefined : (
              <>
                { storyAssetSection }
                { children }
              </>
            ) }
          </View>
          { footerButton }
        </View>
      </Collapsible>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
  },
  trauma: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
