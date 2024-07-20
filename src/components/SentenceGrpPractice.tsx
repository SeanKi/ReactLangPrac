import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Storage } from '@ionic/storage';
import { IonModal, IonChip, IonRange, IonBadge, IonGrid, IonRow, IonCol, IonText, IonButtons, IonInput, IonPopover, IonRadio, IonRadioGroup, IonSelect, IonSelectOption, IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonListHeader, IonItem, IonLabel, IonAvatar, IonButton, IonIcon, IonProgressBar, IonCard, IonCardTitle, IonCardSubtitle, IonCardHeader, IonCardContent, IonCheckbox} from '@ionic/react';
import { musicalNotes, menuOutline, caretForwardCircleOutline, playOutline, listOutline, arrowForwardOutline, shuffleOutline, } from 'ionicons/icons'; // Import the musicalNotes icon <IonIcon name="caret-forward-circle-outline"></IonIcon>
import { chevronBackOutline, chevronForwardOutline, stopCircleOutline, pauseCircleOutline, flash, time } from 'ionicons/icons';
import Select from 'react-select';
import './SentencePractice.css';

type DictGroup = {
    [key: string]: string;
  };

type CommonComponentProps = {
    DictGroup: DictGroup;
    FileName: string;
    InitGroup: string;
  };

// const orientation = useOrientation(); // it doesn't work.
const readDictGroupFromFile = async (filename: string): Promise<DictGroup> => {
  const response = await fetch(filename);
  const fileContent = await response.text();
  return JSON.parse(fileContent);
}

type ContentType = {
  No: string | null;
  Type: string | null;
  Group: string | null;
  FIELD1: string | null;
  FIELD2: string | null;
  DESC: string | null;
  EngFile: string | null;
  KorFile: string | null;
  Hint: string | null;
};

type GroupInfo = {
  Index: number;
  Group: string | null;
  Count: number;
};

let g_contentArray:ContentType[];
let g_bPlay : boolean = false;
let g_bPause : boolean = false;
let g_sLevel : string = '2'; //@SeanKi: this is the mirror value of selectedLevel. for some reason, selectedLevel was not updated in playAudio1Group() function.
type TextState = 'gray' | 'blinking' | 'black';
let g_bSkipTimer : boolean = false;
type TimerID = { value: number };
let timerID1:TimerID = {value: -1}; // for playAudioWait.
let timerID2:TimerID = {value: -1};


const TextComponents: React.FC<{ text: string, playState: string }> = ({ text, playState }) => {
  const getColor = (state:string) => {
    switch (state) {
      case 'gray': return 'gray';
      case 'blinking': return 'black';
      case 'black': return 'black';
    }
  };

  const getAnimation = (state:string) => {
    return state === 'blinking' ? 'blinking 1s infinite' : 'none';
  };
  let state1 = '', state2 = '';
  if (playState === text) {
    state1 = 'blinking';
    state2 = 'gray';
  } else if (playState === (text +'>')) {
    state1 = 'black';
    state2 = 'blinking';
  } else  {
    state1 = 'gray';
    state2 = 'gray';
  }

  return (
    <>
    <span style={{ color: getColor(state1), animation: getAnimation(state1) }}>{text}</span>
    <span style={{ color: getColor(state2), animation: getAnimation(state2) }}>▶</span>
    </>
  );
};

const SentenceGrpPractice: React.FC<CommonComponentProps> = (props) => {
    let dictGroup = props.DictGroup;
    let fileName = props.FileName;
    const buttonStyle = {
      padding: '3px 1px 3px 1px',
      borderRadius: '30%',
    };
    const buttonStyle2 = {
      padding: '3px 1px 3px 1px',
      borderRadius: '30%',
      innerHeight:'30px'
    };
    

  // Call the async function
 
 
  const [groupInfoList, setGroupInfoList] = useState<GroupInfo[]>([
        // ... Add more group info as needed
  ]);
  const { id } = useParams<{ id: string }>();
  let idArray: string[] = [];
  if (id) {
    idArray = id.split(",");
  } else if (props.InitGroup) {
      idArray = props.InitGroup.split(",");
  } else {
    idArray = [Object.keys(dictGroup)[0]];
  }
  const [selectedGroups, setSelectedGroups] = useState<string[]>(idArray);
  const [selectedGroup, setSelectedGroup] = useState("");
  const location=useLocation();
  const sch= location.search;
  const params=new URLSearchParams(sch);
  const grpId= params.get('grpId');
  const [progressTxt, setProgressTxt] = useState("");
  const [endedResult, setEndedResult] = useState("");
  const [skippedTime, setSkippedTime] = useState(0);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentGrpCount, setCurrentGrpCount] = useState(0);
  const [currentGrpStartIndex, setCurrentGrpStartIndex] = useState<number>(0);

  //const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState<string>('00:00:00');


  const [contents, setContents] = useState<ContentType[]>([]);
  const [currentContent, setCurrentContent] = useState<ContentType>();
  const [currentNo, setCurrentNo] = useState("");
  const [currentField, setCurrentField] = useState("");
  const [currentField0, setCurrentField0] = useState("");
  const [currentHint, setCurrentHint] = useState("");
  const [currentDesc, setCurrentDesc] = useState("");
  const [stopButtonName, setStopButtonName] = useState("STOP");

  const [buffer, setBuffer] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShowLine, setIsShowLine] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [isDescChecked, setIsDescChecked] = useState(false);
  const [isHintChecked, setIsHintChecked] = useState(false);
  const [isSemiAutoChecked, setSemiAutoChecked] = useState(true);
  const [isAutoPlay1Sentence, setIsAutoPlay1Sentence] = useState(false); // it is not used.
  const [selectedDirect, setSelectedDirect] = useState("k2e"); //e2k
  const [isShowOrNot, setIsShowOrNot] = useState(false);
  const [isGrayOrBlack, setIsGrayOrBlack] = useState(false);

  const [showLanguagePopover, setShowLanguagePopover] = useState(false);
  const [showDescriptionPopover, setShowDescriptionPopover] = useState(false);
  const [storage, setStorage] = useState<Storage | null>(null);
  const [record, setRecord] = useState<{ key: string; value: any }[]>([]);
  
  const [showModal, setShowModal] = useState(false);
  const [startPauseTime, setStartPauseTime] = useState<Date | null>(null);
  const [currentPauseTime, setCurrentPauseTime] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('2');
  const [inputValue, setInputValue] = useState({ 1: 0.7, 2: 1, 3: 1.8 });
  const [inputInterVal, setInputInterVal] = useState({ Lang: 0.7, Sent: 1 });
  const [groupOptions, setGroupOptions] = useState({Count:0});
  const [playState, setPlayState] = useState('A');
  const [playPitch, setPlayPitch] = useState(1); 
  const [selectedScale, setSelectedScale] = useState('1');

  const handleButtonClick = (scale: string) => {
    document.documentElement.style.setProperty('--font-scale', scale);
    setSelectedScale(scale);
  };
  
  let bPlay : boolean = false;

  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);

  let timerId2 = -1;

  const clearTimer = (tID: TimerID) => {
    if (tID.value > -1) 
      window.clearInterval(tID.value);
    tID.value = -1;
    // console.log("clearTimer bPlay:" + bPlay);
  }

  function sortByNo(a: ContentType, b: ContentType): number {
    const aNo = a.No || "";
    const bNo = b.No || "";
    // 문자열 비교
    return aNo.localeCompare(bNo);
  }

  function getGroupContents(contentArray_:ContentType[], selectedGroups_: string[]) {
    return contentArray_.filter(content => selectedGroups_.includes(content.Group as string));
  }

  function makeOrderList(dir_:string, count:number = -1) {
    if (g_bPlay) return;
    if (dir_ == 'random') {
      const newArray = [...contents];
      newArray.sort(() => Math.random() - 0.5);
      setContents(newArray);
      if (count != -1) {
        let arrayGroupList = newArray.reduce((acc, item) => {
          (acc[item.Group as string] = acc[item.Group as string] || []).push(item);
          return acc;
        }, {} as Record<string, ContentType[]>);
        let contentList = [];

        while (true) {
          let added = false;
          for (let group in arrayGroupList) {
            let items = arrayGroupList[group].splice(0, count);
            if (items.length > 0) {
              contentList.push(...items);
              added = true;
            }
          }
          if (!added) break;
        }
        setContents(contentList);
      }
    } else {
      const newArray = [...contents];
      newArray.sort(sortByNo)
      setContents(newArray)
    }
    setCurrentIndex(0);
  }

  function selectLevel(level_:string) {
    setSelectedLevel(level_);

  }

  // function selectGroup(selectedGroup_: string, bFirst: boolean) {
  //   setSelectedGroup(selectedGroup_);
  //   const grpInfo = groupInfoList.find(groupInfo => groupInfo.Group === selectedGroup_);
  //   const startIndex = grpInfo?.Index as number;
  //   setCurrentGrpStartIndex(startIndex);
  //   if (bFirst)
  //     setCurrentIndex(val => startIndex);
  //   return grpInfo;
  // }
  function selectGroups(selectedGroup_ : string[], bFirst : boolean): GroupInfo[] {
    setSelectedGroups(selectedGroup_);
    let grpInfos: GroupInfo[] = [];
    selectedGroup_.forEach((group) => {
      const grpInfo = groupInfoList.find(groupInfo => groupInfo.Group === group);
      if (grpInfo)
        grpInfos.push(grpInfo);
    });
    setSelectedGroup(grpInfos[0]?.Group as string);
    return grpInfos;
  }

  async function playAudio1Group() {
    let started = new Date();
    // startTime = getCurrentTime();
    const grpInfos = selectGroups(selectedGroups, false);
    //const grpInfo = grpInfos[0];
    //const count = grpInfo?.Count as number;
    let fullCount = contents.length;
    let playCount = fullCount;
    let index = currentIndex;
    if (groupOptions.Count > 0 ) 
    {
      playCount = groupOptions.Count ;
      if (fullCount - index < groupOptions.Count)
        playCount = fullCount - index ;
    }
    // const count = playCount;
    const content = contents[index];
    const startNo = content.No;
    const selectedGroup_ = content.Group;
    const startIndex = index; 
    g_sLevel = selectedLevel;
    setCurrentGrpCount(count_=>playCount);
    setProgressTxt(progressTxt=>"Start!");
    playOn();
    setStopButtonName("Stop");

    let cnt = 0;
    let endNo = startNo;

    setSkippedTime(0);

    while(index < (startIndex + playCount)) {
      if (startNo !== contents[index].No) {
        endNo = contents[index].No;
        //setProgressTxt(progressTxt=>startNo + " ~ " + contents[index].No);
      }
      setSelectedGroup(val_=>contents[index].Group as string);
      setProgress((index - startIndex)/playCount);
      setBuffer((index - startIndex)/playCount);
      setProgressTxt(progressTxt=> `${(index - startIndex)+1}/${playCount}`);
      await playAudio1Line (contents[index]);
      if (!g_bPlay) //isPlaying
        break;
      setCurrentIndex(index=>index+1);
      index++;
      cnt++;
    };
    if (!g_bPlay) //isPlaying
    {
      setProgressTxt(progressTxt=>"Stopped!");  
    } else {
      setProgressTxt(progressTxt=>"Done!");
      if (contents.length <= index)
        setCurrentIndex(0); // move to first.
    }
    setStopButtonName("Close");

    let endTime = getCurrentTime();
    let elapsedTime = endTime - startTime;
    
    let text = `No ${startNo} ~ ${endNo} / Count ${cnt} / Started ${formatedTime(started)} / Elapsed ${formatElapsedTime(elapsedTime/1000)} / Faster ${(skippedTime/1000).toFixed(0)}sec`; //formatElapsedTime(elapsedTime/1000)
    await saveData(startTime ? startTime.toString() : '', text);
    loadDataAll();
    setEndedResult(endedResult=>text);
    console.log(text);
    playOff();
    if (timerId2 > -1) {
      window.clearInterval(timerId2);
      timerId2 = -1;
    }
  };

  const playAudio = (fileName: string | null) => {
    if (audioPlayer) {
      audioPlayer.pause();
    }

    const newAudioPlayer = new Audio(`/audio/${fileName}.mp3`);
    newAudioPlayer.playbackRate = playPitch;
    newAudioPlayer.play();
    setAudioPlayer(newAudioPlayer);
    return newAudioPlayer;
  };

  const defaultWaitTime = 2000;
  const playAudioAndWait = (fileName: string | null, waitRate: number, sentenceOrder: string) => {
    return new Promise<void>((resolve) => {
       setPlayState(prevState=>sentenceOrder);
      let audio = playAudio(fileName);
      if (audio) {
        audio.onended = function () {
          let waitTime = defaultWaitTime;
          if (audio.duration && waitRate) {
            waitTime = audio.duration * waitRate * 1000;
          }
          console.log(`duration:${audio.duration} x waitRate:${waitRate} = waitTime:${waitTime}`);
          if (g_sLevel == '1') {
            waitTime *= inputValue[1];
            console.log(`x ${inputValue[1]} = new waitTime:${waitTime}`);
          } else if (g_sLevel == '2') {
            waitTime *= inputValue[2];
            console.log(`x ${inputValue[2]} = new waitTime:${waitTime}`);
          } else if (g_sLevel == '3') {
            waitTime *= inputValue[3];
            console.log(`x ${inputValue[3]} = new waitTime:${waitTime}`);
          }
          clearTimer(timerID1);
          if (!g_bPlay) return; 
          setPlayState(prevState=>sentenceOrder + '>');
          let elapsedTime = 0;
          const checkInterval = 100; // 100ms 간격으로 체크

          timerID1.value = window.setInterval(() => {
              if (g_bPause) return; // 일시 정지 상태면 아무 것도 하지 않음
              
              elapsedTime += checkInterval;
              if(g_bSkipTimer)
              {
                g_bSkipTimer = false;
                clearTimer(timerID1);
                setSkippedTime(skippedTime=>skippedTime + (waitTime - elapsedTime));
                resolve();
              }
              if (elapsedTime >= waitTime) {
                  clearTimer(timerID1);
                  resolve();
              }
          }, checkInterval);
          // timerID1.value =  window.setInterval(() => {
          //   if (g_bPause) return; //
          //   clearTimer(timerID1);
          //   resolve();
          // }, waitTime);
        };
      }
    });
  };

  const playAudio1Line = async (content : ContentType) => {
    setCurrentContent(content);
    setCurrentField(""); // secondLine
    setCurrentDesc("");
    setCurrentHint(content.Hint??'');
    setIsShowOrNot(true);
    setIsGrayOrBlack(true);
    g_bSkipTimer = false;

    if (selectedDirect == 'k2e') {
      setCurrentField0(content.FIELD2==null?'':content.FIELD2);
      await playAudioAndWait(content.KorFile, inputInterVal.Lang, 'A');
      if (!g_bPlay) return; //isPlaying)
      setCurrentField(content.FIELD1 as string);
      setCurrentDesc(content.DESC as string);
      await playAudioAndWait(content.EngFile, inputInterVal.Sent, 'B');
    } else {
      setCurrentField0(content.FIELD1==null?'':content.FIELD1);
      await playAudioAndWait(content.EngFile, inputInterVal.Lang, 'A');
      if (!g_bPlay) return; //isPlaying)
      setCurrentField(content.FIELD2 as string);
      setCurrentDesc(content.DESC as string);
      await playAudioAndWait(content.KorFile, inputInterVal.Sent, 'B');
    }
  };

  const show1Line = async (content : ContentType) => {
    setCurrentContent(content);
    setSelectedGroup(content.Group as string);
    setCurrentField(""); // secondLine
    setCurrentHint(content.Hint??'');
    setIsShowOrNot(false);
    setIsGrayOrBlack(false);
    if (selectedDirect == 'k2e') {
      setCurrentField0(content.FIELD2==null?'':content.FIELD2);
      setCurrentField(content.FIELD1 as string);
      setCurrentDesc(content.DESC as string);
    } else {
      setCurrentField0(content.FIELD1==null?'':content.FIELD1);
      setCurrentField(content.FIELD2 as string);
      setCurrentDesc(content.DESC as string);
    }
  };

  function playOn () {
    setIsPlaying(true);
    g_bPlay = true;
    g_bPause = false;
    console.log('playOn bPlay:' + g_bPlay);
  }
  function playOff () {
    setIsPlaying(false);
    g_bPlay = false;
    g_bPause = false;
    console.log('playOff bPlay:' + g_bPlay);
  }

  const showMove = async(dir : number)=> {
    setCurrentIndex(index=>index + dir);
    if (isAutoPlay1Sentence) {
      playOn();
      await playAudio1Line(contents[currentIndex]);
      playOff();
    } else {
      show1Line(contents[currentIndex]);
    }
  }

  const playStop =() => {
     if (audioPlayer) {
      audioPlayer.pause();
      console.log("playStop audioPlayer.pause()");
    } else {
      console.log("playStop audioPlayer is null");
    }
    clearTimer(timerID1);
    setProgressTxt(progressTxt=>"");
    playOff();
  }

  const playPause =() => {
    if (g_bPlay && !g_bPause) {
      g_bPause = true;
          if (timerId2 > -1) {
      window.clearInterval(timerId2);
      timerId2 = -1;
    }
      // alert("Paused");
      // g_bPause = false;
      handleOpenModal();
    }
  }


  let startTime:number;
  function getCurrentTime(): number {
    return new Date().getTime();
  }
  function formatElapsedTime(seconds: number): string {
    let hours: number = Math.floor(seconds / 3600);
    let minutes: number = Math.floor((seconds % 3600) / 60);
    let remainingSeconds: number = seconds % 60;
  
    return `${hours}:${minutes}:${remainingSeconds.toFixed(0)}`;
  }

  function formatedTime(currentTime:Date) {
      return currentTime.getFullYear() + '-' + 
                    ('0' + (currentTime.getMonth() + 1)).slice(-2) + '-' + 
                    ('0' + currentTime.getDate()).slice(-2) + ' ' + 
                    ('0' + currentTime.getHours()).slice(-2) + ':' + 
                    ('0' + currentTime.getMinutes()).slice(-2) + ':' + 
                    ('0' + currentTime.getSeconds()).slice(-2);
  }

  const fetchData = async () => {
    const xmlFilePath = fileName; // XML 파일 경로를 수정하세요
    
    try {
      const response = await fetch(xmlFilePath);
      const xmlText = await response.text();
      
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      
      const contentNodes = xmlDoc.querySelectorAll('CONTENT');
      const contentArray = Array.from(contentNodes)
        .filter((contentNode) => contentNode.getAttribute('Group') !== '')
        .map((contentNode) => {
        const field1 = contentNode.querySelector('FIELD1');
        const field2 = contentNode.querySelector('FIELD2');
        const desc = contentNode.querySelector('DESC');
        const hint = contentNode.querySelector('HINT');
        return {
          No: contentNode.getAttribute('No'),
          Type: contentNode.getAttribute('Type'),
          Group: contentNode.getAttribute('Group'),
          FIELD1: field1?field1.textContent: '',
          FIELD2: field2?field2.textContent: '',
          EngFile: field1?field1.getAttribute('Name'):'',
          KorFile: field2?field2.getAttribute('Name'):'',
          DESC: desc?desc.textContent: '',
          Hint: hint?hint.textContent: '',
        };
      });
      g_contentArray = contentArray;
      if (groupInfoList.length == 0) {
        groupInfoList.length = 0;
        let i = 0;
        let curGroup = contentArray[0].Group;
        let grpInfo = { Index: i, Group: curGroup, Count: 0 };
        groupInfoList.push(grpInfo);
        for (i = 0; i < contentArray.length; i++) {
          if (contentArray[i].Group == curGroup) {
            grpInfo.Count++;
          } else { // if (contentArray[i].Group !== curGroup) 
            grpInfo = { Index: i, Group: contentArray[i].Group, Count: 1 }; // start from 1. not 0 for Count;
            curGroup = grpInfo.Group;
            groupInfoList.push(grpInfo);
          }
        }
        selectGroups(selectedGroups, true);
      }
      setContents(getGroupContents(contentArray, selectedGroups));

      // const sortedArray = [...contents].sort(sortByNo);
      // sortedArray.sort(() => Math.random() - 0.5);
      // const groupsToTurn = selectedGroups.length;
      // let nGroupIndex = 0;
      // let resultArray = [];
      // for (let i = 0; i < sortedArray.length; i++) {
      //   for (let j = 0; j < 3; j++) {
      //     if (selectedGroups[nGroupIndex] == sortedArray[i].Group) {
      //       resultArray.push(sortedArray[i]);
      //       sortedArray[i].Type  = 'invalid';
      //     }
      //   }

      //   sortedArray[i].No = (i + 1).toString();
      // }

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
// 데이터 저장 함수
const saveData = async (key: string, value: any): Promise<void> => {
  if (storage)
    await storage.set(key, value);
};

// 데이터 불러오기 함수
const loadData = async (key: string): Promise<any> => {
  if (!storage) return;
  return await storage.get(key);
};

const loadDataAll = async () => {
  if (storage) {
    const keys = await storage.keys();
    const data = await Promise.all(
      keys.map(async key => ({
        key,
        value: await storage.get(key),
      }))
    );
    setRecord(data);
  }
};

  const createStorage = async() => {
    const storage = new Storage();
    await storage.create();
    setStorage(storage);
  }

 useEffect( () => {
    // loadDictGroup();
    fetchData();
    createStorage();
    let interval:any = null;
    if (showModal && startPauseTime) {
      interval = setInterval(() => {
        const now:Date = new Date();
        const diff = new Date(now.getTime() - startPauseTime.getTime());
        const hours = diff.getUTCHours();
        const minutes = diff.getUTCMinutes();
        const seconds = diff.getUTCSeconds();
        setCurrentPauseTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showModal, startPauseTime]);
  
  const handleOpenModal = () => {
    setShowModal(true);
    setStartPauseTime(new Date());
  };
  
  const handleSelectChange = (event: CustomEvent) => {
    const selectedValue = event.detail.value;
    selectGroups(selectedValue, true);
    setContents(getGroupContents(g_contentArray, selectedValue));

    console.log("Selected Group:", selectedValue);
  };

  const handleLanguageChange= (event: CustomEvent) => {
    const val = event.detail.value;
    setSelectedLanguage(val);
  };

  const handleDescCheckChange= (event: CustomEvent) => {
    setIsDescChecked(event.detail.checked);
  }

  const handleHintCheckChange= (event: CustomEvent) => {
    setIsHintChecked(event.detail.checked);
  }

  const handleIsAutoPlay1SentenceChange= (event: CustomEvent) => {
    setIsAutoPlay1Sentence(event.detail.checked);
  }

  const handleSemiAutoCheckChange= (event: CustomEvent) => {
    setSemiAutoChecked(event.detail.checked);
  }

  const handleIntervalChange= (event: CustomEvent) => {
    const val = event.detail.value;
     setSelectedLevel(lvl=>val);
     g_sLevel = val;
  };

  const handleDirectChange= (event: CustomEvent) => {
    const val = event.detail.value;
    setSelectedDirect(val);
  };
  const modal = useRef<HTMLIonModalElement>(null);
  const page = useRef(undefined);

  const [canDismiss, setCanDismiss] = useState(true);
  const [presentingElement, setPresentingElement] = useState<HTMLElement | undefined>(undefined);

  function dismiss() {
    modal.current?.dismiss();
    setIsShowLine(false);
  }

  function clearTimerId2() {
    if (timerId2 > -1) {
      window.clearInterval(timerId2);
      timerId2 = -1;
    }
  }
   const openModal = (index: number = -1) => {
    startTime = new Date().getTime(); // setStartTime(time_ => new Date());
    clearTimerId2();
    timerId2 = timerID2.value = window.setInterval(() => {
      if (startTime) {
        const now = new Date();
        const elapsedSeconds = Math.floor((now.getTime() - startTime) / 1000);
        setElapsedTime(formatElapsedTime(elapsedSeconds));
      }
      if (!g_bPlay)
        clearTimerId2();
    }, 1000);

    if (index == -1) {  // it means play all
      setCanDismiss(true);
      playAudio1Group();
    } else {
      setIsShowLine(true);
      setCurrentIndex(index);
      setCanDismiss(true);
    }
    modal.current?.present(); // modalRef를 사용하여 IonModal을 열기

  };

  const popover = useRef<HTMLIonPopoverElement>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const openPopover = (e: any) => {
    popover.current!.event = e;
    setPopoverOpen(true);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            <div>
              {!isPlaying ? (
                <IonButton onClick={() => { openModal(); }}><IonIcon icon={playOutline}></IonIcon> <IonIcon icon={listOutline}></IonIcon></IonButton>
              ) : <IonButton onClick={() => { setCanDismiss(false); playStop() }}>{stopButtonName}</IonButton>}
            </div>
            <div>
              <IonSelect style={{ fontSize: '1.1em', marginLeft: '0.5em' }} value={selectedGroups} interface="popover" onIonChange={handleSelectChange} multiple={true}>
                {groupInfoList.map(group => (
                  <IonSelectOption key={group.Group} value={group.Group}>
                    {group.Group !== null ? dictGroup[group.Group] : "No Group"}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </div>
          </div>
          <IonButtons slot="end">
            <IonButton onClick={openPopover}>
              <IonIcon icon={menuOutline} />
            </IonButton>
            <IonPopover ref={popover} isOpen={popoverOpen} onDidDismiss={() => setPopoverOpen(false)}>
              <IonList>
                <IonItem>
                  <IonGrid>
                    <IonRow>
                      <IonCol size="6">
                        <IonList>
                          <IonRadioGroup value={selectedLanguage} onIonChange={handleLanguageChange}>
                            <IonItem>
                              <IonLabel>All</IonLabel>
                              <IonRadio slot="start" value="all" />
                            </IonItem>
                            <IonItem>
                              <IonLabel>Kor</IonLabel>
                              <IonRadio slot="start" value="kor" />
                            </IonItem>
                            <IonItem>
                              <IonLabel>Eng</IonLabel>
                              <IonRadio slot="start" value="eng" />
                            </IonItem>
                          </IonRadioGroup>
                        </IonList>
                      </IonCol>

                      <IonCol size="6">
                        <IonList>
                          <IonItem>
                            <IonLabel>Hint</IonLabel>
                            <IonCheckbox slot="start" checked={isHintChecked} onIonChange={handleHintCheckChange}></IonCheckbox>
                          </IonItem>
                          <IonItem>
                            <IonLabel>Desc.</IonLabel>
                            <IonCheckbox slot="start" checked={isDescChecked} onIonChange={handleDescCheckChange}></IonCheckbox>
                          </IonItem>
                        </IonList>
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                </IonItem>
                <IonItem>
                  <IonList>
                    <IonRadioGroup value={selectedDirect} onIonChange={handleDirectChange}>
                      <IonItem>
                        <IonLabel>Korean to English</IonLabel>
                        <IonRadio slot="start" value="k2e" />
                      </IonItem>
                      <IonItem>
                        <IonLabel>English to Korean</IonLabel>
                        <IonRadio slot="start" value="e2k" />
                      </IonItem>
                    </IonRadioGroup>
                  </IonList>
                </IonItem>
                <IonItem>
                  <IonLabel>Direction. </IonLabel>
                  <IonButton onClick={() => makeOrderList('forward')}><IonIcon icon={arrowForwardOutline}></IonIcon></IonButton>
                  <IonButton onClick={() => makeOrderList('random')}><IonIcon icon={shuffleOutline}></IonIcon></IonButton>
                  <IonButton onClick={() => makeOrderList('random', 3)}><IonIcon icon={shuffleOutline}></IonIcon>3</IonButton>
                  <IonButton onClick={() => makeOrderList('random', 5)}><IonIcon icon={shuffleOutline}></IonIcon>5</IonButton>
                </IonItem>
                <IonItem>
                  <IonLabel>Group Play Count </IonLabel>
                  <IonInput labelPlacement="floating" label="Count" type="number" fill="outline" value={groupOptions.Count} maxlength={3} style={{ width: '6em' }}
                    onIonChange={e => setGroupOptions({ ...groupOptions, Count: parseInt(e.detail.value!) })}></IonInput>
                </IonItem>
                <IonItem>
                  <IonLabel>Interval </IonLabel>
                  <IonButtons>
                    <IonButton
                      onClick={() => selectLevel('1')}
                      fill={selectedLevel === '1' ? 'solid' : 'outline'}
                      color={selectedLevel === '1' ? 'primary' : 'default'}
                    >
                      High
                    </IonButton>
                    <IonButton
                      onClick={() => selectLevel('2')}
                      fill={selectedLevel === '2' ? 'solid' : 'outline'}
                      color={selectedLevel === '2' ? 'primary' : 'default'}
                    >
                      Mid
                    </IonButton>
                    <IonButton
                      onClick={() => selectLevel('3')}
                      fill={selectedLevel === '3' ? 'solid' : 'outline'}
                      color={selectedLevel === '3' ? 'primary' : 'default'}
                    >
                      Low
                    </IonButton>
                  </IonButtons>
                </IonItem>
                <IonItem>
                  <IonLabel></IonLabel>
                  <IonButtons>
                    <IonInput type="number" fill="outline" labelPlacement="floating" label="H" value={inputValue[1]} className="fixed-size-input"
                      onIonChange={e => setInputValue({ ...inputValue, 1: parseFloat(e.detail.value!) })}></IonInput>
                    <IonInput type="number" fill="outline" labelPlacement="floating" label="M" value={inputValue[2]} className="fixed-size-input"
                      onIonChange={e => setInputValue({ ...inputValue, 2: parseFloat(e.detail.value!) })}></IonInput>
                    <IonInput type="number" fill="outline" labelPlacement="floating" label="L" value={inputValue[3]} className="fixed-size-input"
                      onIonChange={e => setInputValue({ ...inputValue, 3: parseFloat(e.detail.value!) })}></IonInput>
                  </IonButtons>
                </IonItem>
                <IonItem>
                  <IonLabel></IonLabel>
                  <IonButtons>
                    <IonInput labelPlacement="floating" label="Lang" type="number" fill="outline" value={inputInterVal.Lang} maxlength={3} style={{ width: '6em' }}
                      onIonChange={e => setInputInterVal({ ...inputInterVal, Lang: parseFloat(e.detail.value!) })}></IonInput>
                    <IonInput labelPlacement="floating" label="Sentence" type="number" fill="outline" value={inputInterVal.Sent} maxlength={3} style={{ width: '6em' }}
                      onIonChange={e => setInputInterVal({ ...inputInterVal, Sent: parseFloat(e.detail.value!) })}></IonInput>
                  </IonButtons>
                </IonItem>
                <IonItem>
                  <IonLabel>Play Pitch Rate</IonLabel>
                  <IonRange min={0.5} max={1.5} step={0.1} pin={true} value={playPitch} onIonChange={e => setPlayPitch(e.detail.value as number)} />
                </IonItem>
                <IonItem>
                <IonLabel>Size</IonLabel>
                <IonButton fill={selectedScale === '1' ? 'solid' : 'outline'} onClick={() => handleButtonClick('1')}>1</IonButton>
                <IonButton fill={selectedScale === '1.25' ? 'solid' : 'outline'} onClick={() => handleButtonClick('1.25')}>1.25</IonButton>
                <IonButton fill={selectedScale === '1.5' ? 'solid' : 'outline'} onClick={() => handleButtonClick('1.5')}>1.50</IonButton>
                <IonButton fill={selectedScale === '1.75' ? 'solid' : 'outline'} onClick={() => handleButtonClick('1.75')}>1.75</IonButton>
                </IonItem>
              </IonList>
            </IonPopover>
          </IonButtons>
          {!isPlaying && (<div>{endedResult}</div>)}
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Sentence</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonGrid>
          <IonRow>
            <IonCol>
              <IonList>
                <IonListHeader> <h1>Sentence practice - Group</h1></IonListHeader>
                <p style={{ marginLeft: '0.5em' }}>{selectedGroups.length > 1 ? '' : dictGroup[selectedGroup]}</p>
                {contents.map((content, index) => (
                  selectedGroups.includes(content.Group ?? '') && (
                    <IonItem key={content.No}>
                      <IonAvatar slot="start" className="avatarStyle">
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <IonChip outline={true} onClick={() => { show1Line(content); openModal(index); }}>{content.No}</IonChip>
                          {/* <IonButton onClick={async () => { setCurrentIndex(index); playOn(); await playAudio1Line(content); playOff(); }}>
                            <IonIcon icon={caretForwardCircleOutline} />
                          </IonButton> */}
                        </div>
                      </IonAvatar>
                      <IonLabel className={currentIndex == index ? 'highlight' : ''}>
                        {isHintChecked?(
                          <p className="ion-text-wrap">{content.Hint}</p>
                        ):''}
                        {selectedLanguage != 'eng' ? (
                          <h2 className="ion-text-wrap" style={{ fontStyle: 'Nanum Myeongjo' }}>
                            {/* <IonButton style={buttonStyle} onClick={() => playAudio(content.KorFile)}>
                            <IonIcon icon={caretForwardCircleOutline}></IonIcon></IonButton> */}
                            {content.FIELD2}</h2>
                        ) : ''}
                        {selectedLanguage != 'kor' ? (
                          <h2 className="ion-text-wrap">
                            {/* <IonButton style={buttonStyle} onClick={() => playAudio(content.EngFile)}>
                            <IonIcon icon={caretForwardCircleOutline}></IonIcon></IonButton> */}
                            {content.FIELD1}</h2>
                        ) : ''}
                        {isDescChecked ? (
                          <p className="ion-text-wrap">{content.DESC}</p>
                        ) : ''}
                      </IonLabel>
                    </IonItem>
                  )
                ))}
              </IonList>
            </IonCol>
          </IonRow>
        </IonGrid>
        <IonModal className="modal-small" isOpen={showModal} onDidDismiss={() => setShowModal(false)} backdropDismiss={false}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Paused</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <p>Paused</p>
            <p>Elapsed Time: {currentPauseTime}</p>
            <IonButton onClick={() => { setShowModal(false); g_bPause = false; }}>Close</IonButton>
          </IonContent>
        </IonModal>
        <IonModal className="modal-big" ref={modal} canDismiss={canDismiss} presentingElement={presentingElement} backdropDismiss={false} >
          <IonHeader>
            <IonToolbar>
              <IonTitle>
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                  <div>
                    {isPlaying && (
                      <>
                        <TextComponents text='A' playState={playState} />
                        <TextComponents text='B' playState={playState} />
                        <IonText style={{ marginLeft: '10px' }} className="primary-background white-text border-round font-size-small">{progressTxt}</IonText>
                        <IonProgressBar value={(currentIndex - currentGrpStartIndex + 1) / currentGrpCount} color="primary" style={{ marginLeft: '5px', width: '2.5em' }}></IonProgressBar>
                      </>
                    )}
                  </div>
                  <div>
                    <IonChip className="large-chip" outline={true}>{dictGroup[selectedGroup]}</IonChip> 180 Sentences {isPlaying && (<IonText>[{elapsedTime}]</IonText>)}
                  </div>
                </div>
              </IonTitle>

              <IonButtons slot="end" style={{ overflow: 'auto' }}>
                <IonText>Lvl<IonBadge color="primary">{selectedLevel === '1' ? 'High' : selectedLevel === '2' ? 'Mid' : 'Low'} </IonBadge></IonText>
                <IonText>
                  (x{selectedLevel === '1' ? inputValue[1] : selectedLevel === '2' ? inputValue[2] : inputValue[3]}) </IonText>
                {!isPlaying && (
                  <IonButton fill="outline" onClick={() => { dismiss() }}>Close</IonButton>
                )
                }
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonCard style={{ minHeight: '16em' }}>
              <IonCardHeader>
                <IonCardTitle style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <IonChip outline={true} onClick={()=>setIsShowOrNot(false)}>{currentContent?.No}</IonChip>
                    {(isPlaying || isSemiAutoChecked) && (<IonText>{currentHint}</IonText>)}
                  </div>
                  {!isPlaying && isSemiAutoChecked && (
                    <IonButtons>
                      <IonButton fill="outline" onClick={() => { showMove(-1); }}>
                        <IonIcon icon={chevronBackOutline} slot="start" />
                      </IonButton>
                      <IonButton fill="outline" onClick={() => { showMove(1);}}>
                        <IonIcon icon={chevronForwardOutline} slot="start" />
                      </IonButton>
                      <IonLabel>Auto Play</IonLabel><IonCheckbox slot="start" value="autoPlay" checked={isAutoPlay1Sentence}  onIonChange={handleIsAutoPlay1SentenceChange}/>
                    </IonButtons>
                  )}
                  {isPlaying && (
                    <IonButtons>
                      <IonButton fill="outline" onClick={() => { playStop(); setCanDismiss(true); }}>
                        <IonIcon icon={stopCircleOutline} slot="start" />
                        <span className='hide-on-small'>Stop</span>
                      </IonButton>
                      <IonButton fill="outline" onClick={() => { playPause(); }}>
                        <IonIcon icon={pauseCircleOutline} slot="start" />
                        <span className='hide-on-small'>Pause</span>
                      </IonButton>
                      <IonButton fill="outline" onClick={()=>g_bSkipTimer=true}>
                        <IonIcon icon={chevronForwardOutline} slot="start" />
                      </IonButton>
                    </IonButtons>
                  )}
                </IonCardTitle>
                {(isPlaying || isShowLine) ? (
                  <div>
                  <div style={{display: 'flex', alignItems: 'center'}}>
                  {!isAutoPlay1Sentence && 
                      <IonIcon 
                      icon={caretForwardCircleOutline} 
                      onClick={() => playAudio(currentContent?.KorFile)}
                      style={{fontSize: '3em', cursor: 'pointer', display: !isPlaying ? 'block' : 'none'}}
                    />
                  }
                  <IonCardSubtitle className={`ion-text-wrap ${currentField0.length >= 40 ? 'size-small' : currentField0.length >= 20 ? 'size-mid' : 'size-big'}`}>{currentField0}</IonCardSubtitle>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center'}}>
    
                  {!(isAutoPlay1Sentence) && 
                  <>
                        <IonIcon 
                          icon={caretForwardCircleOutline} 
                          onClick={() => playAudio(currentContent?.EngFile)}
                          style={{fontSize: '3em', cursor: 'pointer', display: !isPlaying ? 'block' : 'none'}}
                        />
                      {!isPlaying && (
                      <>
                        {/* <IonButton 
                          onClick={() => { setIsShowOrNot(false); }}
                          fill="outline"
                          style={{ transform: 'scale(0.6)'
                          }} // 첫 번째 버튼 80% 크기
                        >
                        </IonButton> */}
                        <IonButton 
                          onClick={() => { setIsShowOrNot(true); setIsGrayOrBlack(false); }}
                          fill="outline"
                          style={{ backgroundColor: 'grey', color: 'white'
                           }} // 두 번째 버튼 회색
                        >
                        </IonButton>
                        <IonButton 
                          onClick={() => { setIsShowOrNot(true); setIsGrayOrBlack(true); }}
                          fill="outline"
                          style={{ backgroundColor: 'black', color: 'white'
                           }} // 세 번째 버튼 검은색
                        >
                        </IonButton>
                      </>
                      )}
                  </>
                  }
                  <IonCardSubtitle className={`ion-text-wrap ${currentField0.length >= 40 ? 'size-small' : currentField0.length >= 20 ? 'size-mid' : 'size-big'}`}
                    style={{
                      display: isShowOrNot ? 'block' : 'none',
                      color: isGrayOrBlack ? 'black' : 'lightgray',
                      fontSize: isGrayOrBlack ? '' : '2vw'
                    }}>{currentField}</IonCardSubtitle>
                  </div>
                 </div>
                ) :
                  <IonList>
                    {[...record].reverse().map((item, index) => (
                      <IonItem key={index}>
                        <IonLabel style={{
                          fontSize: index === 0 ? '1.3em' : 'normal',
                          whiteSpace: 'normal',
                          wordWrap: 'break-word',
                          fontWeight: index === 0 ? 'bold' : 'normal'
                        }}>
                          {item.value}
                        </IonLabel>
                      </IonItem>
                    ))}
                  </IonList>
                }
              </IonCardHeader>
              <IonCardContent className="ion-text-wrap">{!isPlaying ? currentDesc : ''}</IonCardContent>
            </IonCard>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default SentenceGrpPractice;
