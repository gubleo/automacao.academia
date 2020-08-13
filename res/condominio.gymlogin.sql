create or replace function condominio.gymlogin(param json) returns SETOF condominio.gymunidade
    language plpgsql
as $$
declare
    _usuario varchar;
    senha   varchar;
    _unidade condominio.gymunidade%rowtype;
begin
    _usuario := param ->> 'usuario';
    senha := param ->> 'pass';

    select num, initcap(primeironome(nome_proprietario)) as responsavel, u.bloco, u.unidade
    into _unidade
    from condominio.unidades u
             join (
        select bloco, unidade
        from portal.usuario
        where lower(login) = _usuario
          and password = translate(encode(lower(senha)::bytea, 'base64'), '=', '')
    ) as a
                  on u.bloco = a.bloco and u.unidade = a.unidade;

    if (_unidade isnull) then
        raise invalid_password using message = 'Usuário ou senha inválida';
    end if;

    return query select _unidade.num, _unidade.responsavel, _unidade.bloco, _unidade.unidade;
end
$$;

alter function condominio.gymlogin(json) owner to postgres;

