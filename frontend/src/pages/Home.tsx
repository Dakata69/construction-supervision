// frontend/src/pages/Home.tsx
import { Row, Col, Card, Typography, Space, Avatar } from 'antd';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { TeamOutlined, SafetyCertificateOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const { Title, Paragraph, Text } = Typography;

const HeroSection = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 80px 20px;
  text-align: center;
  color: white;
  border-radius: 12px;
  margin-bottom: 60px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
  position: relative;
  overflow: hidden;
  
  @media (max-width: 768px) {
    padding: 40px 16px;
    margin-bottom: 30px;
  }
`;

const HeroContent = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  background: rgba(0,0,0,0.55);
  padding: 48px 32px 52px;
  border-radius: 20px;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  box-shadow: 0 12px 50px rgba(0,0,0,0.35);
  border: 1px solid rgba(255,255,255,0.15);
  
  @media (max-width: 768px) {
    padding: 24px 16px 28px;
    border-radius: 12px;
  }
`;

const TeamSection = styled.div`
  padding: 0 20px 60px;
  
  @media (max-width: 768px) {
    padding: 0 12px 30px;
  }
`;

const TeamIntro = styled.div`
  max-width: 720px;
  margin: 0 auto 48px;
  background: rgba(255,255,255,0.95);
  padding: 40px 36px 44px;
  border-radius: 22px;
  box-shadow: 0 8px 36px rgba(0,0,0,0.18);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: 1px solid rgba(0,0,0,0.08);
  
  @media (max-width: 768px) {
    padding: 24px 20px 28px;
    margin: 0 auto 24px;
    border-radius: 12px;
  }
`;

const StyledCard = styled(Card)`
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }

  .ant-card-cover {
    height: 280px;
    overflow: hidden;
    background: #f0f2f5;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ant-card-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  &:hover .ant-card-cover img {
    transform: scale(1.05);
  }

  .ant-card-body {
    padding: 20px;
    min-height: 200px;
  }

  .ant-card-meta-title {
    white-space: normal !important;
    word-wrap: break-word;
    line-height: 1.4 !important;
    margin-bottom: 12px !important;
    font-size: 16px !important;
  }
`;

const PhotoPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  
  .ant-avatar {
    width: 120px;
    height: 120px;
    font-size: 48px;
  }
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  color: rgba(0, 0, 0, 0.65);
  
  .anticon {
    color: #667eea;
  }
`;

// Team data
const teamMembers = [
  {
    id: 1,
    name: 'Маргарита Стефанова Вълчева-Дукова',
    position: 'Инженер',
    email: 'margi_st@abv.bg',
    phone: '0898622889',
    photo: '/team/Маргарита Стефанова Вълчева-Дукова.jpg',
    bio: 'Опитен инженер с над 10 години опит в областта на строителния надзор. Специализирана в проектиране и контрол на сградни конструкции.',
  },
  {
    id: 2,
    name: 'Стефан Вълчев',
    position: 'Главен инженер',
    email: '',
    phone: '0898605874',
    photo: '/team/Стефан Вълчев.jpg',
    bio: 'Ръководи екипа с дългогодишен опит в управлението на сложни строителни проекти. Експерт в техническия контрол и качеството на строителството.',
  },
  {
    id: 3,
    name: 'Асен Стефанов Вълчев',
    position: 'Юристконсулт',
    email: '',
    phone: '0899832465',
    photo: '/team/Асен Стефанов Вълчев.jpg',
    bio: 'Специалист по строителното право и договорни отношения. Осигурява правна защита и консултации по всички аспекти на строителните проекти.',
  },
  {
    id: 4,
    name: 'Ивелина Русенова Вълчева',
    position: 'Технически секретар',
    email: '',
    phone: '0898698654',
    photo: '/team/Ивелина Русенова Вълчева.jpg',
    bio: 'Отговаря за административното обслужване и техническата документация. Осигурява своевременно подготвяне и архивиране на всички проектни документи.',
  },
];

export default function Home() {
  const backgroundEnabled = useSelector((state: RootState) => state.ui.backgroundEnabled);
  return (
    <div>
      <HeroSection>
        <HeroContent>
          <SafetyCertificateOutlined style={{ fontSize: 72, marginBottom: 28, filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.4))' }} />
          <Title level={1} style={{ color: '#ffffff', marginBottom: 24, fontWeight: 800, letterSpacing: '0.5px', opacity: backgroundEnabled ? 0.6 : 1 }}>
            Строителен надзор и контрол
          </Title>
          <Paragraph style={{ fontSize: 21, lineHeight: 1.6, color: '#ffffff', fontWeight: 600, margin: '0 auto', opacity: backgroundEnabled ? 0.6 : 1 }}>
            Професионален екип от опитни специалисти, осигуряващи качествен строителен надзор и контрол на вашите проекти
          </Paragraph>
        </HeroContent>
      </HeroSection>

      <TeamSection>
        <TeamIntro style={{ textAlign: 'center' }}>
          <TeamOutlined style={{ fontSize: 54, color: '#667eea', marginBottom: 24, filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.25))' }} />
          <Title level={2} style={{ fontWeight: 800, color: '#121212', marginBottom: 20, letterSpacing: '0.5px', opacity: backgroundEnabled ? 0.6 : 1 }}>
            Нашият екип
          </Title>
          <Paragraph style={{ fontSize: 19, color: '#222', fontWeight: 600, margin: '0 auto', lineHeight: 1.55, opacity: backgroundEnabled ? 0.6 : 1 }}>
            Запознайте се с професионалистите, които ще се грижат за успешното изпълнение на вашия проект
          </Paragraph>
        </TeamIntro>

        <Row gutter={[24, 24]}>
          {teamMembers.map((member) => (
            <Col xs={24} sm={12} lg={6} key={member.id}>
              <StyledCard
                cover={
                  <img 
                    alt={member.name} 
                    src={member.photo}
                    onError={(e) => {
                      // Fallback to placeholder if image doesn't load
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = `
                        <div style="width: 100%; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center;">
                          <div style="width: 120px; height: 120px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 48px; color: white; font-weight: bold;">
                            ${member.name.charAt(0)}
                          </div>
                        </div>
                      `;
                    }}
                  />
                }
              >
                <Card.Meta
                  title={
                    <Title level={4} style={{ marginBottom: 8, fontSize: '18px', lineHeight: '1.4', fontWeight: '600' }}>
                      {member.name}
                    </Title>
                  }
                  description={
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <Text strong style={{ color: '#667eea', fontSize: 15 }}>
                        {member.position}
                      </Text>
                      {member.bio && (
                        <Paragraph 
                          style={{ 
                            marginTop: 8, 
                            marginBottom: 12,
                            fontSize: 14,
                            color: 'rgba(0, 0, 0, 0.65)'
                          }}
                        >
                          {member.bio}
                        </Paragraph>
                      )}
                      {member.email && (
                        <InfoRow>
                          <MailOutlined />
                          <Text style={{ fontSize: 13 }}>{member.email}</Text>
                        </InfoRow>
                      )}
                      {member.phone && (
                        <InfoRow>
                          <PhoneOutlined />
                          <Text style={{ fontSize: 13 }}>{member.phone}</Text>
                        </InfoRow>
                      )}
                    </Space>
                  }
                />
              </StyledCard>
            </Col>
          ))}
        </Row>
      </TeamSection>
    </div>
  );
}
