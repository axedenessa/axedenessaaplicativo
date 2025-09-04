-- Corrigir valores dos jogos da Alana que estão pela metade
-- Multiplicar por 2 os valores onde cartomante = 'alana_cerqueira'
UPDATE public.games 
SET value = value * 2
WHERE cartomante = 'alana_cerqueira' AND game_date = '2025-09-03';

-- Inserir os dois jogos que estão faltando no banco
INSERT INTO public.games (
  client_name, 
  game_type, 
  cartomante, 
  value, 
  game_date, 
  payment_time, 
  status
) VALUES 
(
  'Aline castanhola da silva',
  'pergunta_objetiva',
  'vanessa_barreto', 
  9.00,
  '2025-09-03',
  '20:40:00',
  'jogo_finalizado'
),
(
  'Laura carvalho brandao',
  'mandala_amorosa',
  'vanessa_barreto',
  30.00, 
  '2025-09-03',
  '15:36:00',
  'jogo_finalizado'
);