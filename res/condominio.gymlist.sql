create or replace function condominio.gymlist(params json) returns SETOF condominio.agendamentos_academia
    language plpgsql
as $$
declare
    i          record;
    _data      date;
    _local     varchar;
    _diasemana double precision;
    _qtdlocal  int;

begin

    _data := params ->> 'data';
    _local := params ->> 'local';
    _diasemana := extract(DOW FROM _data);
    _qtdlocal := 15;

    /*
     * Define a quantidade de vagas disponíveis para o local
     */
    if (_local = 'bk') then
        _qtdlocal := 10;
    end if;

    /**
      0 Domingo
      1 Segunda
      2 Terça
      3 Quarta
      4 Quinta
      5 Sexta
      6 Sabado
     */

    FOR i IN (select horario
              from (
                       -- Manhã
                       select case
                                  when _diasemana between 1 and 5 then generate_series(6, 11)
                                  when _diasemana = 6 then generate_series(6, 11)
                                  when _diasemana = 0 then null
                                  end as horario
                       union
                       -- Tarde
                       select case
                                  when _diasemana between 1 and 5 then generate_series(14, 19)
                                  when _diasemana = 6 then null
                                  when _diasemana = 0 then null
                                  end as horario
                       order by horario
                   ) as a
              where horario notnull)
        LOOP
            return query
                select i.horario as hora,
                       ag.ocupados::integer,
                       case
                           when ag.ocupados >= _qtdlocal
                               then 'Indisponível'::varchar
                           else (_qtdlocal - ag.ocupados || ' vagas')::varchar
                           end      situacao
                from (
                         select count(*) as ocupados
                         from acesso.reserva_academia
                         where data = _data
                           and horario = i.horario
                           and local = _local
                     ) as ag;
        END LOOP;


end
$$;

alter function condominio.gymlist(json) owner to postgres;

