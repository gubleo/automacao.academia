create or replace function condominio.gymadd(params json) returns character varying
    language plpgsql
as $$
    /** {data: data, horario: horario, morador: morador} **/
declare
    _data date;
    _horario integer;
    _morador varchar;
    _local varchar;
    _limite int;
    _quatidadelocal int;

begin

    _data := params->>'data';
    _horario := params->>'horario';
    _morador := params->>'morador';
    _local := params->>'local';

    _quatidadelocal := 15;
    if (_local = 'bk') then
        _quatidadelocal = 10;
    end if;

    _limite := count(*)
               from acesso.reserva_academia
               where data = _data and horario = _horario and local = _local;

    if (_limite >= _quatidadelocal) then
        raise exception using message = 'O horário selecionado atingiu o limite de reservas';
    end if;

    if (select autenticacao from acesso.reserva_academia where data = _data and horario = _horario and autenticacao = _morador) notnull then
        raise exception using message  = 'Você já reservou este horário';
    end if;

    insert into acesso.reserva_academia (autenticacao, data, horario, local)
    values (_morador, _data, _horario, _local);

    return 'Horário reservado com sucesso';

end
$$;

alter function condominio.gymadd(json) owner to postgres;

