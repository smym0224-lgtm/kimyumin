import { ClueData } from '../types';

export const CLUES: ClueData[] = [
  {
    id: 1,
    title: '단서 1. 공식 가정통신문',
    typeBadge: '가정통신문 형식의 가상 자료',
    category: 'official',
    teacherObservationPoints: [
      '학교의 공식적인 자료인가?',
      '행사 날짜와 장소가 구체적으로 제시되어 있는가?'
    ]
  },
  {
    id: 2,
    title: '단서 2. 공식 학사 일정표',
    typeBadge: '학사 일정표 형식의 가상 자료',
    category: 'official',
    teacherObservationPoints: [
      '공식 일정표에 행사 일정이 기록되어 있는가?',
      '일정표만으로 현재 행사 개최 여부를 완전히 확정할 수 있는가?',
      '이후 변경 공지가 있었는지도 확인해야 하는가?'
    ]
  },
  {
    id: 3,
    title: '단서 3. 단체 채팅방의 소문',
    typeBadge: '가상 단체 채팅 화면',
    category: 'chat',
    teacherObservationPoints: [
      '최초 정보 제공자가 누구인지 확인할 수 있는가?',
      '취소 이유나 확인 가능한 근거가 제시되어 있는가?',
      '다른 사람에게 들었다는 사실만으로 믿을 수 있는가?'
    ]
  },
  {
    id: 4,
    title: '단서 4. \'긴급 취소\' 안내문 캡처',
    typeBadge: '출처가 불분명한 가상 안내문 캡처',
    category: 'capture',
    teacherObservationPoints: [
      '작성자가 누구인지 알 수 있는가?',
      '언제 작성된 자료인지 알 수 있는가?',
      '원본 출처를 확인할 수 있는가?',
      '긴급하다는 표현 자체가 정보의 신뢰성을 보장하는가?'
    ]
  },
  {
    id: 5,
    title: '단서 5. 2025년 효성벼리 문화예술발표회 안내문',
    typeBadge: '작년 안내문 형식의 가상 자료',
    category: 'official',
    teacherObservationPoints: [
      '자료의 작성 연도는 언제인가?',
      '과거의 정보가 올해에도 그대로 적용된다고 볼 수 있는가?',
      '정보를 사용할 때 날짜와 최신성을 확인해야 하는가?'
    ]
  },
  {
    id: 6,
    title: '단서 6. 익명의 쪽지',
    typeBadge: '익명 쪽지 형식의 가상 자료',
    category: 'memo',
    teacherObservationPoints: [
      '직접 확인한 정보인가, 다른 사람에게 전해 들은 정보인가?',
      '전달 과정에서 내용이 달라졌을 가능성이 있는가?',
      '누구에게 무엇을 확인해야 하는가?'
    ]
  },
  {
    id: 7,
    title: '단서 7. 효성벼리 문화예술발표회 준비 사진',
    typeBadge: '가상 사진 카드',
    category: 'photo',
    teacherObservationPoints: [
      '사진만으로 언제 촬영되었는지 알 수 있는가?',
      '과거에 촬영한 사진일 가능성은 없는가?',
      '준비 사진만으로 현재 행사가 예정대로 진행된다고 확정할 수 있는가?'
    ]
  },
  {
    id: 8,
    title: '단서 8. 학교의 최종 알림장',
    typeBadge: '학교 알림장 형식의 가상 자료',
    category: 'official',
    teacherObservationPoints: [
      '공식적인 최종 안내 자료인가?',
      '앞서 확인한 취소 소문과 내용이 일치하는가?',
      '여러 자료를 비교한 뒤 어떤 결론을 내릴 수 있는가?'
    ]
  }
];
