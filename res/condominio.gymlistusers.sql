create or replace function condominio.gymlistusers(params json) returns SETOF condominio.gymusers
    language plpgsql
as $$
declare
    _unidade integer;
    _unidadeinfo record;
begin

    _unidade := params ->> 'unidade';

    select *
    into _unidadeinfo
    from condominio.unidades
    where unidades.num = _unidade;

    return query
        SELECT
            moradores.num,
            moradores.unidade,
            initcap(moradores.nome::text) AS nome,
            moradores.autenticacao,
            moradores.foto1,
            case
                when idade(moradores.nascimento) < 12 then 'inferior'
                when idade(moradores.nascimento) between 12 and 16 then 'acompanhante'
                else 'superior'
                end AS situacao_idade,
            max(a.horario) AS hora
        FROM condominio.moradores
                 LEFT JOIN (
            SELECT reserva_academia.autenticacao, reserva_academia.id, reserva_academia.data, reserva_academia.horario
            FROM acesso.reserva_academia
            WHERE reserva_academia.data = 'now'::text::date
        ) a ON moradores.autenticacao::text = a.autenticacao::text
        WHERE moradores.autenticacao IS NOT NULL and moradores.unidade = _unidade
        GROUP BY moradores.num, moradores.unidade, initcap(moradores.nome::text), moradores.autenticacao, moradores.foto1,
                 case
                     when idade(moradores.nascimento) < 12 then 'inferior'
                     when idade(moradores.nascimento) between 12 and 16 then 'acompanhante'
                     else 'superior'
                     end

        union

        SELECT
            personal.num,
            _unidade AS unidade,
            initcap(primeironome(personal.nome))::text || ' (Personal)' AS nome,
            personal.autenticacao,
            personal.foto1,
            '' AS situacao_idade,
            max(a.horario)                AS hora
        FROM condominio.personal
                 LEFT JOIN (
            SELECT reserva_academia.autenticacao, reserva_academia.id, reserva_academia.data, reserva_academia.horario
            FROM acesso.reserva_academia
            WHERE reserva_academia.data = 'now'::text::date
        ) a ON personal.autenticacao::text = a.autenticacao::text
                 LEFT JOIN condominio.personal_atividades on personal.num = personal_atividades.personal
        WHERE personal_atividades.bloco = _unidadeinfo.bloco and personal_atividades.unidade = _unidadeinfo.unidade
        GROUP BY personal.num, personal.unidade, initcap(personal.nome::text), personal.autenticacao, personal.foto1;


end
$$;

alter function condominio.gymlistusers(json) owner to postgres;

