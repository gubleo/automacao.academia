drop function condominio.gymlistusers(params json);
drop type condominio.gymusers;
create type condominio.gymusers as (
                                       num integer,
                                       unidade integer,
                                       nome text,
                                       autenticacao varchar,
                                       foto1 varchar,
                                       idade text,
                                       hora integer
                                   );

create or replace function condominio.gymlistusers(params json) returns setof condominio.gymusers language plpgsql as
$$
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
            CASE
                WHEN idade(moradores.nascimento) < 16 THEN 'Idade não permitida'::text
                ELSE NULL::text
                END AS idade,
            max(a.horario) AS hora
        FROM condominio.moradores
                 LEFT JOIN (
            SELECT reserva_academia.autenticacao, reserva_academia.id, reserva_academia.data, reserva_academia.horario
            FROM acesso.reserva_academia
            WHERE reserva_academia.data = 'now'::text::date
        ) a ON moradores.autenticacao::text = a.autenticacao::text
        WHERE moradores.autenticacao IS NOT NULL and moradores.unidade = _unidade
        GROUP BY moradores.num, moradores.unidade, initcap(moradores.nome::text), moradores.autenticacao, moradores.foto1,
                 CASE
                     WHEN idade(moradores.nascimento) < 16 THEN 'Idade não permitida'::text
                     ELSE NULL::text
                     END

        union

        SELECT
            personal.num,
            _unidade AS unidade,
            initcap(primeironome(personal.nome))::text || ' (Personal)' AS nome,
            personal.autenticacao,
            personal.foto1,
            null::text AS idade,
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

select * from condominio.gymlistusers('{"unidade":"2486"}');


grant all on function condominio.gymlistusers;



select * from condominio.unidades where bloco = 11;