import {
  useMemo,
  useCallback,
  useContext,
} from 'react';
import {
  useRecoilValue,
  useResetRecoilState,
  useSetRecoilState
} from 'recoil';
import { WidgetContext } from 'context';

import {
  privacyShieldEnabledState,
  privacyShieldEnabledVisualState,
  privacyShieldSectionsState,
  privacyShieldCurrentSectionsState,
  privacyShieldLoadingState,
  privacyShieldTextState,
  privacyShieldOpenState,
} from '../state';

import {
  TextSection,
  PrivacyCategories,
  SectionItem,
} from '../types';
import { v4 as uuidv4 } from 'uuid';

const usePrivacyShield = () => {
  const { evoya } = useContext(WidgetContext);
  const enabled = useRecoilValue(privacyShieldEnabledState);
  const setEnabled = useSetRecoilState(privacyShieldEnabledState);
  const enabledVisual = useRecoilValue(privacyShieldEnabledVisualState);
  const setEnabledVisual = useSetRecoilState(privacyShieldEnabledVisualState);
  const open = useRecoilValue(privacyShieldOpenState);
  const setOpen = useSetRecoilState(privacyShieldOpenState);
  const loading = useRecoilValue(privacyShieldLoadingState);
  const setLoading = useSetRecoilState(privacyShieldLoadingState);
  const sections = useRecoilValue(privacyShieldSectionsState);
  const setSections = useSetRecoilState(privacyShieldSectionsState);
  const currentSections = useRecoilValue(privacyShieldCurrentSectionsState);
  const setCurrentSections = useSetRecoilState(privacyShieldCurrentSectionsState);
  const currentText = useRecoilValue(privacyShieldTextState);
  const setCurrentText = useSetRecoilState(privacyShieldTextState);

  const combinedSections: SectionItem[] = useMemo(() => {
    // const existingStrings = sections.map(sec => sec.string.toLowerCase());
    // const newSecsFiltered = currentSections.filter(ns => !existingStrings.includes(ns.string.toLowerCase()));

    const newSections = [
      ...sections,
      // ...newSecsFiltered
      ...currentSections,
    ];

    return newSections;
  }, [sections, currentSections]);

  const lockSections = useCallback(() => {
    const allSections = combinedSections.map((section) => ({
        ...section,
        isLocked: true,
    }));

    setSections(allSections);
    setCurrentSections([]);
  }, [combinedSections]);

  const categories: PrivacyCategories = useMemo<PrivacyCategories>(() => {
    return combinedSections.reduce((accCats: PrivacyCategories, section) => {
      if (accCats[section.type]) {
        return {
          ...accCats,
          [section.type]: [
            ...accCats[section.type],
            {
              ...section,
              anonString: `${section.type} ${accCats[section.type].length + 1}`
            }
          ]
        };
      }

      return {
        ...accCats,
        [section.type]: [
          {
            ...section,
            anonString: `${section.type} 1`
          }
        ]
      };
    }, {});
  }, [combinedSections]);

  const addSection = useCallback((section: SectionItem) => {
    const newSections = [
      ...currentSections,
      section
    ];

    setCurrentSections(newSections)
  }, [currentSections]);

  const removeSection = useCallback((id: string) => {
    const newSections = currentSections.filter((sec) => sec.id !== id);

    setCurrentSections(newSections);
  }, [currentSections]);

  const resetSections = useCallback(() => {
    setCurrentSections([]);
  }, [currentSections]);

  const editSectionType = useCallback((id: string, type: string) => {
    const newSections = currentSections.map((ps) => ({
      ...ps,
      ...(ps.id === id ? {type} : {})
    }));

    setCurrentSections(newSections);
  }, [currentSections]);

  const setSectionAnon = useCallback((id: string, isAnon: boolean) => {
    const newSections = currentSections.map((section) => {
      if (section.id === id) {
        return {
          ...section,
          isAnon
        }
      }
      return section;
    });

    setCurrentSections(newSections);
  }, [currentSections]);

  const toggleSectionAnon = useCallback((id: string) => {
    const newSections = currentSections.map((section) => {
      if (section.id === id) {
        return {
          ...section,
          isAnon: !section.isAnon
        }
      }
      return section;
    });

    setCurrentSections(newSections);
  }, [currentSections]);

  const getPrivacySections = useCallback(async (text: string) => {
    setCurrentText(text);
    setOpen(true);

    const apiKey = evoya?.api?.privacyShield.apiKey;
    const agent_uuid = evoya?.api?.privacyShield.privacyAgent;

    if (!agent_uuid) {
      setCurrentSections([]);
      return;
    }
    
    setLoading(true);

    const baseUrl = evoya?.api?.baseUrl;
    const apiUrl = `${baseUrl}/api/agent/${agent_uuid}/invoke/`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Api-Key ${apiKey}`
      },
      body: JSON.stringify({
        text: text,
        context: {}
      })
    });

    const responseJson = await response.json();

    if (responseJson.answer) {
      const answerJson = responseJson.answer.substring(responseJson.answer.indexOf('['), responseJson.answer.lastIndexOf(']') + 1);

      try {
        const parsedSections = JSON.parse(answerJson);
        const mappedSections: SectionItem[] = parsedSections.map((ps: any) => ({
          ...ps,
          id: `ps-${uuidv4()}`,
          isAnon: true,
          isLocked: false
        }));
        const existingStrings = sections.map(sec => sec.string.toLowerCase());
        const newSecsFiltered = mappedSections.filter(ns => !existingStrings.includes(ns.string.toLowerCase()));
        
        // addSections(mappedSections, true);
        setCurrentSections(newSecsFiltered);
      } catch (e) {
        console.error(e);
      }
    }

    setLoading(false);
  }, [sections]);

  const textSections = useMemo(() => {
    const catSections = Object.values(categories).flatMap((cat) => cat);
    let secText = currentText;
    catSections.forEach((section) => {
      secText = secText.replaceAll(new RegExp(section.string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&'), "gi"), `{$}{=${section.id}=}{$}`);
    });

    const secs = secText.split('{$}');
    const textSections: TextSection[] = secs.map((sec) => {
      if (sec.startsWith('{=')) {
        const secId = sec.substring(2, sec.length - 2);
        const secData = catSections.find((sec) => sec.id === secId);
        if (secData) {
          return {
            ...secData
          };
        }
      }

      return {
        string: sec
      };
    });

    return textSections;
  }, [categories, currentText]);

  const anonText = useMemo<string>(() => {
    return textSections.map((ts) => ts.isAnon ? ts.anonString : ts.string).join('');
  }, [textSections]);

  const transformOutput = useCallback((text: string) => {
    let response = text;
    const catSections = Object.values(categories).flatMap((cat) => cat);
    catSections.forEach((section) => {
      response = response.replaceAll(new RegExp(section.isAnon ? (section.anonString ?? '') : (section.string ?? '').replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&'), "gi"), `<span data-privacy-component="${section.id}">${section.isAnon ? section.anonString : section.string}</span>`);
    });
    
    return response;
  }, [categories]);

  return {
    transformOutput,
    open,
    setOpen,
    enabled,
    setEnabled,
    enabledVisual,
    setEnabledVisual,
    currentText,
    loading,
    setLoading,
    sections: combinedSections,
    lockSections,
    resetSections,
    // setSections,
    addSection,
    removeSection,
    // addSections,
    editSectionType,
    setSectionAnon,
    toggleSectionAnon,
    // lockAllSections,
    categories,
    textSections,
    anonText,
    getPrivacySections,
  }
}

export {
  usePrivacyShield
}