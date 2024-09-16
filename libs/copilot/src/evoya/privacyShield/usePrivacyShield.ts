import {
  useMemo,
  useCallback
} from 'react';
import {
  useRecoilValue,
  useResetRecoilState,
  useSetRecoilState
} from 'recoil';

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

const usePrivacyShield = () => {
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

  const categories: PrivacyCategories = useMemo<PrivacyCategories>(() => {
    return sections.reduce((accCats: PrivacyCategories, section) => {
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
  }, [sections]);

  const addSection = useCallback((section: SectionItem) => {
    const newSections = [
      ...sections,
      section
    ];

    setSections(newSections);
  }, [sections]);

  const removeSection = useCallback((id: string) => {
    const newSections = sections.filter((sec) => sec.id !== id);

    setSections(newSections);
  }, [sections]);

  const addSections = useCallback((newSecs: SectionItem[], lockOld: boolean = true) => {
    const oldSections = sections.map((section) => ({
        ...section,
        ...(lockOld ? {isLocked: true} : {})
    }));

    const existingStrings = sections.map(sec => sec.string);
    const newSecsFiltered = newSecs.filter(ns => !existingStrings.includes(ns.string));

    console.log(sections, newSecsFiltered);

    const newSections = [
      ...oldSections,
      ...newSecsFiltered
    ];

    setSections(newSections);
  }, [sections]);

  const editSectionType = useCallback((id: string, type: string) => {
    const newSections = sections.map((ps) => ({
      ...ps,
      ...(ps.id === id ? {type} : {})
    }));

    setSections(newSections);
  }, [sections]);

  const setSectionAnon = useCallback((id: string, isAnon: boolean) => {
    const newSections = sections.map((section) => {
      if (section.id === id) {
        return {
          ...section,
          isAnon
        }
      }
      return section;
    });

    setSections(newSections);
  }, [sections]);

  const toggleSectionAnon = useCallback((id: string) => {
    const newSections = sections.map((section) => {
      if (section.id === id) {
        return {
          ...section,
          isAnon: !section.isAnon
        }
      }
      return section;
    });

    setSections(newSections);
  }, [sections]);

  const lockAllSections = useCallback(() => {
    const newSections = sections.map((section) => {
      return {
        ...section,
        isLocked: true
      }
    });

    setSections(newSections);
  }, [sections]);

  const getPrivacySections = useCallback(async (text: string/*, submitFunction: (text: string) => void*/) => {
    setLoading(true);
    setCurrentText(text);
    // setSubmit(submitFunction);
    setOpen(true);

    const apiKey = '75sT2p4Q.2sFsdlGGtXHdGmTHxAsmm4XZI6sMf3Vp';
    const agent_uuid = '68486423-ded6-4af4-86bc-3d5a2dd2ec9d';
    // const baseUrl = 'https://avaia.io';
    const baseUrl = 'http://localhost:8000';
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
        const mappedSections: SectionItem[] = parsedSections.map((ps: any, index: number) => ({
          ...ps,
          id: `ps-${index}`,
          isAnon: true,
          isLocked: false
        }));
        
        addSections(mappedSections, true);
      } catch (e) {
        console.error(e);
      }
    }

    setLoading(false);
  }, [addSections]);

  const textSections = useMemo(() => {
    const catSections = Object.values(categories).flatMap((cat) => cat);
    let secText = currentText;
    catSections.forEach((section) => {
      secText = secText.replaceAll(new RegExp(section.string, "gi"), `{$}{=${section.id}=}{$}`);
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

  return {
    open,
    setOpen,
    enabled,
    setEnabled,
    enabledVisual,
    setEnabledVisual,
    currentText,
    loading,
    setLoading,
    sections,
    // setSections,
    addSection,
    removeSection,
    addSections,
    editSectionType,
    setSectionAnon,
    toggleSectionAnon,
    lockAllSections,
    categories,
    textSections,
    anonText,
    getPrivacySections,
  }
}

export {
  usePrivacyShield
}