import type { Location } from './locations-standard';

export const LOCATIONS_JW: Location[] = [
  // ─── 현대 JW 장소 ───────────────────────────────────────────────────────────
  {
    name: { ko: '왕국회관', en: 'Kingdom Hall', zh: '王国聚会所' },
    roles: {
      ko: ['장로', '연설자', '음향담당', '안내인', '성경연구생', '어린이', '자매'],
      en: ['Elder', 'Speaker', 'Sound Operator', 'Attendant', 'Bible Student', 'Child', 'Sister'],
      zh: ['长老', '演讲者', '音响操作员', '招待员', '圣经学生', '小孩', '姊妹'],
    },
  },
  {
    name: { ko: '대회장', en: 'Convention Hall', zh: '大会场地' },
    roles: {
      ko: ['연설자', '침례후보자', '안내봉사자', '구급반', '음향팀', '관객', '자원봉사자'],
      en: ['Speaker', 'Baptism Candidate', 'Attendant', 'First Aid', 'Sound Team', 'Audience', 'Volunteer'],
      zh: ['演讲者', '受浸候选人', '招待员', '急救员', '音响组', '听众', '志愿者'],
    },
  },
  {
    name: { ko: '베델', en: 'Bethel', zh: '伯特利' },
    roles: {
      ko: ['베델 성원', '인쇄공', '요리사', '안내인', '번역자', '관리인', '방문객'],
      en: ['Bethelite', 'Printer', 'Cook', 'Guide', 'Translator', 'Caretaker', 'Visitor'],
      zh: ['伯特利成员', '印刷工', '厨师', '导游', '翻译', '管理员', '访客'],
    },
  },
  {
    name: { ko: '봉사 구역', en: 'Ministry Territory', zh: '传道地区' },
    roles: {
      ko: ['파이오니아', '전도인', '집주인', '관심자', '어린이', '인도자', '차량봉사자'],
      en: ['Pioneer', 'Publisher', 'Householder', 'Interested One', 'Child', 'Leader', 'Driver'],
      zh: ['先驱', '传道员', '住户', '有兴趣的人', '小孩', '带领者', '司机'],
    },
  },
  {
    name: { ko: '성경연구 모임', en: 'Bible Study', zh: '圣经研究' },
    roles: {
      ko: ['인도자', '연구생', '참관자', '어린이', '호스트', '통역자', '새신자'],
      en: ['Conductor', 'Student', 'Observer', 'Child', 'Host', 'Interpreter', 'New One'],
      zh: ['主持人', '学生', '旁听者', '小孩', '东道主', '翻译', '新人'],
    },
  },
  {
    name: { ko: '국제 대회', en: 'International Convention', zh: '国际大会' },
    roles: {
      ko: ['해외 대표', '통역자', '안내봉사자', '침례후보자', '연설자', '음악팀', '자원봉사자'],
      en: ['Delegate', 'Interpreter', 'Attendant', 'Baptism Candidate', 'Speaker', 'Music Team', 'Volunteer'],
      zh: ['代表', '翻译', '招待员', '受浸候选人', '演讲者', '音乐团队', '志愿者'],
    },
  },
  {
    name: { ko: '파수대 사무실', en: 'Watchtower Office', zh: '守望台办公室' },
    roles: {
      ko: ['장로', '출판인', '비서', '편집장', '조정자', '홍보담당', '방문객'],
      en: ['Elder', 'Publisher', 'Secretary', 'Chief Editor', 'Coordinator', 'Public Affairs', 'Visitor'],
      zh: ['长老', '出版者', '秘书', '总编辑', '协调员', '公关负责人', '访客'],
    },
  },
  {
    name: { ko: '출판 사무실', en: 'Publishing Office', zh: '出版办公室' },
    roles: {
      ko: ['인쇄원', '편집자', '출판인', '자원봉사자', '감독관', '배포담당', '방문객'],
      en: ['Printer', 'Editor', 'Publisher', 'Volunteer', 'Supervisor', 'Distribution Manager', 'Visitor'],
      zh: ['印刷工', '编辑', '出版者', '志愿者', '监督', '发行负责人', '访客'],
    },
  },
  {
    name: { ko: '지부 사무소', en: 'Branch Office', zh: '分部办事处' },
    roles: {
      ko: ['감독관', '출판인', '자원봉사자', '조정자', '번역자', '통역자', '방문객'],
      en: ['Supervisor', 'Publisher', 'Volunteer', 'Coordinator', 'Translator', 'Interpreter', 'Visitor'],
      zh: ['监督', '出版者', '志愿者', '协调员', '翻译', '口译员', '访客'],
    },
  },
  {
    name: { ko: '전도 현장', en: 'Field Service', zh: '传道现场' },
    roles: {
      ko: ['전도인', '파이오니아', '집주인', '관심자', '봉사 조장', '차량봉사자', '어린이'],
      en: ['Publisher', 'Pioneer', 'Householder', 'Interested One', 'Group Overseer', 'Driver', 'Child'],
      zh: ['传道员', '先驱', '住户', '有兴趣的人', '组长', '司机', '小孩'],
    },
  },
  {
    name: { ko: '왕국전파자 학교', en: 'School for Kingdom Evangelizers', zh: '王国传道员学校' },
    roles: {
      ko: ['교사', '학생', '장로', '봉사의 종', '파이오니아', '회중 조정자', '졸업생'],
      en: ['Teacher', 'Student', 'Elder', 'Ministerial Servant', 'Pioneer', 'Congregation Coordinator', 'Graduate'],
      zh: ['教师', '学生', '长老', '服务仆人', '先驱', '会众协调员', '毕业生'],
    },
  },
  {
    name: { ko: '기념식', en: 'Memorial', zh: '纪念会' },
    roles: {
      ko: ['연설자', '기름부음 받은 자', '안내원', '출판인', '자원봉사자', '관찰자', '참석자'],
      en: ['Speaker', 'Anointed One', 'Usher', 'Publisher', 'Volunteer', 'Observer', 'Attendee'],
      zh: ['演讲者', '受膏者', '引导员', '出版者', '志愿者', '观察者', '与会者'],
    },
  },
  {
    name: { ko: '가족 숭배', en: 'Family Worship', zh: '家庭崇拜' },
    roles: {
      ko: ['아버지', '어머니', '자녀', '조부모', '이웃', '손님', '어린이'],
      en: ['Father', 'Mother', 'Child', 'Grandparent', 'Neighbor', 'Guest', 'Little One'],
      zh: ['父亲', '母亲', '孩子', '祖父母', '邻居', '客人', '小孩'],
    },
  },
  {
    name: { ko: '회중 회관', en: 'Congregation Hall', zh: '会众大厅' },
    roles: {
      ko: ['음향기사', '서기', '마이크 담당', '미디어 담당', '건물담당', '안내원', '보조봉사자'],
      en: ['Sound Technician', 'Secretary', 'Microphone Handler', 'Media Operator', 'Building Caretaker', 'Usher', 'Assistant'],
      zh: ['音响技师', '秘书', '话筒助手', '媒体操作员', '建筑管理员', '引导员', '协助者'],
    },
  },
  {
    name: { ko: '대회 등록', en: 'Assembly Registration', zh: '大会注册' },
    roles: {
      ko: ['등록원', '출판인', '자원봉사자', '참석자', '조정자', '통역자', '배지 담당자'],
      en: ['Registrar', 'Publisher', 'Volunteer', 'Attendee', 'Coordinator', 'Interpreter', 'Badge Handler'],
      zh: ['登记员', '出版者', '志愿者', '与会者', '协调员', '翻译', '证件管理员'],
    },
  },
  {
    name: { ko: '회관 청소', en: 'Hall Clean-up', zh: '会堂清洁' },
    roles: {
      ko: ['청소부', '출판인', '자원봉사자', '조정자', '어린이', '도우미', '가족'],
      en: ['Cleaner', 'Publisher', 'Volunteer', 'Coordinator', 'Child', 'Helper', 'Family Member'],
      zh: ['清洁工', '出版者', '志愿者', '协调员', '小孩', '助手', '家人'],
    },
  },
  {
    name: { ko: '순회 대회', en: 'Circuit Assembly', zh: '巡回大会' },
    roles: {
      ko: ['순회 감독자', '장로', '파이오니아', '출판인', '침례후보자', '연설자', '안내봉사자'],
      en: ['Circuit Overseer', 'Elder', 'Pioneer', 'Publisher', 'Baptism Candidate', 'Speaker', 'Attendant'],
      zh: ['分区监督', '长老', '先驱', '出版者', '受浸候选人', '演讲者', '招待员'],
    },
  },
  {
    name: { ko: '주간 집회', en: 'Weekly Meeting', zh: '每周聚会' },
    roles: {
      ko: ['사회자', '장로', '학생', '봉사의 종', '실연자', '청중', '안내원'],
      en: ['Chairman', 'Elder', 'Student', 'Ministerial Servant', 'Demonstrator', 'Audience', 'Usher'],
      zh: ['主席', '长老', '学生', '服务仆人', '示范者', '听众', '引导员'],
    },
  },
  {
    name: { ko: '공개강연', en: 'Public Talk', zh: '公开演讲' },
    roles: {
      ko: ['연설자', '청중', '출판인', '자원봉사자', '조정자', '안내원', '사회자'],
      en: ['Speaker', 'Audience', 'Publisher', 'Volunteer', 'Coordinator', 'Usher', 'Chairman'],
      zh: ['演讲者', '听众', '出版者', '志愿者', '协调员', '引导员', '主席'],
    },
  },
  {
    name: { ko: '성경 연구실', en: 'Bible Study Room', zh: '圣经研究室' },
    roles: {
      ko: ['연구원', '사서', '번역자', '편집자', '학자', '교정자', '방문객'],
      en: ['Researcher', 'Librarian', 'Translator', 'Editor', 'Scholar', 'Proofreader', 'Visitor'],
      zh: ['研究员', '图书馆员', '翻译', '编辑', '学者', '校对员', '访客'],
    },
  },
  {
    name: { ko: '지역 대회', en: 'Regional Convention', zh: '地区大会' },
    roles: {
      ko: ['참석자', '침례후보자', '자원봉사자', '조직자', '연설자', '통역자', '안내봉사자'],
      en: ['Attendee', 'Baptism Candidate', 'Volunteer', 'Organizer', 'Speaker', 'Interpreter', 'Attendant'],
      zh: ['与会者', '受浸候选人', '志愿者', '组织者', '演讲者', '翻译', '招待员'],
    },
  },
  {
    name: { ko: '공부모임', en: 'Study Group', zh: '学习小组' },
    roles: {
      ko: ['그룹 인도자', '참여자', '토론자', '어린이', '방문객', '통역자', '새신자'],
      en: ['Group Leader', 'Participant', 'Discussant', 'Child', 'Visitor', 'Interpreter', 'New One'],
      zh: ['组长', '参与者', '讨论者', '小孩', '访客', '翻译', '新人'],
    },
  },
  {
    name: { ko: '왕국봉사', en: 'Kingdom Ministry', zh: '王国事工' },
    roles: {
      ko: ['봉사 그룹장', '특별 파이오니아', '봉사의 종', '새신자', '관심자', '장로', '비정규 파이오니아'],
      en: ['Service Group Overseer', 'Special Pioneer', 'Ministerial Servant', 'New One', 'Interested One', 'Elder', 'Auxiliary Pioneer'],
      zh: ['服务组长', '特别先驱', '服务仆人', '新人', '有兴趣的人', '长老', '临时先驱'],
    },
  },
  {
    name: { ko: '침례 장소', en: 'Baptism Site', zh: '受浸地点' },
    roles: {
      ko: ['침례 후보자', '연설자', '출판인', '자원봉사자', '조정자', '안내원', '가족'],
      en: ['Baptism Candidate', 'Speaker', 'Publisher', 'Volunteer', 'Coordinator', 'Usher', 'Family Member'],
      zh: ['受浸候选人', '演讲者', '出版者', '志愿者', '协调员', '引导员', '家人'],
    },
  },
  {
    name: { ko: '대회 뷔페', en: 'Convention Dinner Hall', zh: '大会餐厅' },
    roles: {
      ko: ['요리사', '서비스원', '출판인', '자원봉사자', '조직자', '조정자', '식사봉사자'],
      en: ['Cook', 'Server', 'Publisher', 'Volunteer', 'Organizer', 'Coordinator', 'Food Volunteer'],
      zh: ['厨师', '服务员', '出版者', '志愿者', '组织者', '协调员', '餐饮志愿者'],
    },
  },
  {
    name: { ko: '자원봉사 센터', en: 'Volunteer Center', zh: '志愿者中心' },
    roles: {
      ko: ['조정자', '출판인', '자원봉사자', '참석자', '훈련관', '안내원', '봉사담당자'],
      en: ['Coordinator', 'Publisher', 'Volunteer', 'Attendee', 'Trainer', 'Usher', 'Service Manager'],
      zh: ['协调员', '出版者', '志愿者', '与会者', '培训师', '引导员', '服务管理员'],
    },
  },
  {
    name: { ko: '성경학교', en: 'Bible School', zh: '圣经学校' },
    roles: {
      ko: ['교사', '학생', '부모', '장로', '실연자', '청중', '졸업생'],
      en: ['Teacher', 'Student', 'Parent', 'Elder', 'Demonstrator', 'Audience', 'Graduate'],
      zh: ['教师', '学生', '父母', '长老', '示范者', '听众', '毕业生'],
    },
  },
  {
    name: { ko: '길리앗 학교', en: 'Gilead School', zh: '基列圣经学院' },
    roles: {
      ko: ['강사', '학생', '통역자', '베델 성원', '장로', '감독관', '방문객'],
      en: ['Instructor', 'Student', 'Interpreter', 'Bethelite', 'Elder', 'Supervisor', 'Visitor'],
      zh: ['讲师', '学生', '口译员', '伯特利成员', '长老', '监督', '访客'],
    },
  },
  {
    name: { ko: '부모자녀 모임', en: 'Parent-Child Meeting', zh: '亲子聚会' },
    roles: {
      ko: ['부모', '자녀', '장로', '강사', '청소년', '어린이', '사회자'],
      en: ['Parent', 'Child', 'Elder', 'Instructor', 'Youth', 'Little One', 'Chairman'],
      zh: ['父母', '孩子', '长老', '讲师', '青少年', '小孩', '主席'],
    },
  },
  {
    name: { ko: '대규모 대회', en: 'Grand Assembly', zh: '盛大大会' },
    roles: {
      ko: ['대표단', '특별 연설자', '자원봉사자', '사회자', '통역자', '침례후보자', '안내봉사자'],
      en: ['Delegation', 'Special Speaker', 'Volunteer', 'Chairman', 'Interpreter', 'Baptism Candidate', 'Attendant'],
      zh: ['代表团', '特别演讲者', '志愿者', '主席', '翻译', '受浸候选人', '招待员'],
    },
  },
  {
    name: { ko: '출판물 발표회', en: 'Publication Release', zh: '出版物发布会' },
    roles: {
      ko: ['발표자', '편집자', '출판인', '자원봉사자', '조정자', '참석자', '통역자'],
      en: ['Presenter', 'Editor', 'Publisher', 'Volunteer', 'Coordinator', 'Attendee', 'Interpreter'],
      zh: ['发布者', '编辑', '出版者', '志愿者', '协调员', '与会者', '翻译'],
    },
  },
  {
    name: { ko: '왕국회관 건축 현장', en: 'Kingdom Hall Construction', zh: '王国聚会所建筑工地' },
    roles: {
      ko: ['공사감독', '자원봉사자', '전기기사', '목수', '설계자', '조정자', '견습생'],
      en: ['Construction Overseer', 'Volunteer', 'Electrician', 'Carpenter', 'Designer', 'Coordinator', 'Apprentice'],
      zh: ['施工监督', '志愿者', '电工', '木匠', '设计师', '协调员', '学徒'],
    },
  },
  {
    name: { ko: '순회 감독자 방문', en: 'Circuit Overseer Visit', zh: '分区监督来访' },
    roles: {
      ko: ['순회 감독자', '장로', '회중 조정자', '봉사의 종', '파이오니아', '출판인', '성경연구생'],
      en: ['Circuit Overseer', 'Elder', 'Congregation Coordinator', 'Ministerial Servant', 'Pioneer', 'Publisher', 'Bible Student'],
      zh: ['分区监督', '长老', '会众协调员', '服务仆人', '先驱', '传道员', '圣经学生'],
    },
  },
  {
    name: { ko: '집필실', en: 'Writing Room', zh: '写作室' },
    roles: {
      ko: ['집필자', '연구자', '번역자', '교정자', '그래픽 디자이너', '부서장', '비서'],
      en: ['Writer', 'Researcher', 'Translator', 'Proofreader', 'Graphic Designer', 'Department Head', 'Secretary'],
      zh: ['撰稿人', '研究员', '翻译', '校对员', '平面设计师', '部门主管', '秘书'],
    },
  },

  // ─── 성경 장소 ───────────────────────────────────────────────────────────────
  {
    name: { ko: '노아의 방주', en: "Noah's Ark", zh: '挪亚方舟' },
    roles: {
      ko: ['노아', '셈', '함', '야벳', '노아의 아내', '동물관리자', '비둘기'],
      en: ['Noah', 'Shem', 'Ham', 'Japheth', "Noah's Wife", 'Animal Keeper', 'Dove'],
      zh: ['挪亚', '闪', '含', '雅弗', '挪亚的妻子', '动物管理员', '鸽子'],
    },
  },
  {
    name: { ko: '에덴동산', en: 'Garden of Eden', zh: '伊甸园' },
    roles: {
      ko: ['아담', '하와', '천사', '뱀', '새', '양', '정원사'],
      en: ['Adam', 'Eve', 'Angel', 'Serpent', 'Bird', 'Sheep', 'Gardener'],
      zh: ['亚当', '夏娃', '天使', '蛇', '鸟', '羊', '园丁'],
    },
  },
  {
    name: { ko: '예루살렘 성전', en: 'Jerusalem Temple', zh: '耶路撒冷圣殿' },
    roles: {
      ko: ['대제사장', '레위인', '순례자', '상인', '바리새인', '경비병', '서기관'],
      en: ['High Priest', 'Levite', 'Pilgrim', 'Merchant', 'Pharisee', 'Guard', 'Scribe'],
      zh: ['大祭司', '利未人', '朝圣者', '商人', '法利赛人', '卫兵', '文士'],
    },
  },
  {
    name: { ko: '다니엘의 사자굴', en: "Daniel's Lions' Den", zh: '但以理的狮子坑' },
    roles: {
      ko: ['다니엘', '사자', '왕', '신하', '천사', '간수', '구경꾼'],
      en: ['Daniel', 'Lion', 'King', 'Advisor', 'Angel', 'Guard', 'Spectator'],
      zh: ['但以理', '狮子', '国王', '大臣', '天使', '看守', '旁观者'],
    },
  },
  {
    name: { ko: '갈릴리 호수', en: 'Lake of Galilee', zh: '加利利湖' },
    roles: {
      ko: ['예수', '베드로', '어부', '세리', '군중', '병든 사람', '배 주인'],
      en: ['Jesus', 'Peter', 'Fisherman', 'Tax Collector', 'Crowd', 'Sick Person', 'Boat Owner'],
      zh: ['耶稣', '彼得', '渔夫', '税吏', '群众', '病人', '船主'],
    },
  },
  {
    name: { ko: '출애굽 광야', en: 'Exodus Wilderness', zh: '出埃及旷野' },
    roles: {
      ko: ['모세', '아론', '미리암', '정탐꾼', '이스라엘 백성', '레위인', '불평자'],
      en: ['Moses', 'Aaron', 'Miriam', 'Scout', 'Israelite', 'Levite', 'Complainer'],
      zh: ['摩西', '亚伦', '米利暗', '探子', '以色列人', '利未人', '抱怨者'],
    },
  },
  {
    name: { ko: '여리고 성벽', en: 'Walls of Jericho', zh: '耶利哥城墙' },
    roles: {
      ko: ['여호수아', '제사장', '라합', '정탐꾼', '나팔수', '병사', '여리고 왕'],
      en: ['Joshua', 'Priest', 'Rahab', 'Spy', 'Trumpeter', 'Soldier', 'King of Jericho'],
      zh: ['约书亚', '祭司', '喇合', '探子', '吹号者', '士兵', '耶利哥王'],
    },
  },
  {
    name: { ko: '베들레헴 마구간', en: 'Bethlehem Stable', zh: '伯利恒马厩' },
    roles: {
      ko: ['마리아', '요셉', '목자', '점성술사들', '천사', '소', '당나귀'],
      en: ['Mary', 'Joseph', 'Shepherd', 'Astrologers', 'Angel', 'Ox', 'Donkey'],
      zh: ['马利亚', '约瑟', '牧羊人', '占星家们', '天使', '牛', '驴'],
    },
  },
  {
    name: { ko: '큰 물고기 뱃속', en: 'Inside the Big Fish', zh: '大鱼腹中' },
    roles: {
      ko: ['요나', '물고기', '선원', '기도하는 사람', '해초', '파도', '선장'],
      en: ['Jonah', 'Fish', 'Sailor', 'Praying Person', 'Seaweed', 'Wave', 'Captain'],
      zh: ['约拿', '大鱼', '水手', '祷告的人', '海草', '波浪', '船长'],
    },
  },
  {
    name: { ko: '바벨탑 공사현장', en: 'Tower of Babel', zh: '巴别塔工地' },
    roles: {
      ko: ['니므롯', '건축가', '벽돌공', '감독관', '노동자', '통역자', '구경꾼'],
      en: ['Nimrod', 'Architect', 'Bricklayer', 'Overseer', 'Worker', 'Interpreter', 'Spectator'],
      zh: ['宁录', '建筑师', '砌砖工', '监工', '工人', '翻译', '旁观者'],
    },
  },
  {
    name: { ko: '성전산', en: 'Temple Mount', zh: '圣殿山' },
    roles: {
      ko: ['로마 총독', '바리새인', '율법 교사', '환전상', '로마 군인', '순례자', '예언자'],
      en: ['Roman Governor', 'Pharisee', 'Teacher of the Law', 'Money Changer', 'Roman Soldier', 'Pilgrim', 'Prophet'],
      zh: ['罗马总督', '法利赛人', '律法教师', '兑换银钱的人', '罗马士兵', '朝圣者', '先知'],
    },
  },
  {
    name: { ko: '시내산', en: 'Mount Sinai', zh: '西奈山' },
    roles: {
      ko: ['모세', '여호수아', '이스라엘 장로', '레위인', '이스라엘 백성', '아론', '제사장'],
      en: ['Moses', 'Joshua', 'Israelite Elder', 'Levite', 'Israelite', 'Aaron', 'Priest'],
      zh: ['摩西', '约书亚', '以色列长老', '利未人', '以色列人', '亚伦', '祭司'],
    },
  },
  {
    name: { ko: '겟세마네', en: 'Gethsemane', zh: '客西马尼' },
    roles: {
      ko: ['예수', '베드로', '야고보', '요한', '유다', '성전 경비병', '천사'],
      en: ['Jesus', 'Peter', 'James', 'John', 'Judas', 'Temple Guard', 'Angel'],
      zh: ['耶稣', '彼得', '雅各', '约翰', '犹大', '圣殿卫兵', '天使'],
    },
  },
  {
    name: { ko: '동산 무덤', en: 'Garden Tomb', zh: '花园坟墓' },
    roles: {
      ko: ['막달라 마리아', '요셉', '니고데모', '천사', '경비병', '제자', '목격자'],
      en: ['Mary Magdalene', 'Joseph', 'Nicodemus', 'Angel', 'Guard', 'Disciple', 'Witness'],
      zh: ['抹大拉马利亚', '约瑟', '尼哥底母', '天使', '卫兵', '门徒', '见证人'],
    },
  },
  {
    name: { ko: '다락방', en: 'Upper Room', zh: '楼上的房间' },
    roles: {
      ko: ['예수', '베드로', '요한', '유다', '도마', '집주인', '제자'],
      en: ['Jesus', 'Peter', 'John', 'Judas', 'Thomas', 'Host', 'Disciple'],
      zh: ['耶稣', '彼得', '约翰', '犹大', '多马', '房主', '门徒'],
    },
  },
  {
    name: { ko: '시온산', en: 'Mount Zion', zh: '锡安山' },
    roles: {
      ko: ['다윗왕', '솔로몬', '제사장', '선지자', '레위인', '파수꾼', '순례자'],
      en: ['King David', 'Solomon', 'Priest', 'Prophet', 'Levite', 'Watchman', 'Pilgrim'],
      zh: ['大卫王', '所罗门', '祭司', '先知', '利未人', '守望者', '朝圣者'],
    },
  },
];
