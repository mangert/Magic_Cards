// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22; 

import "./IERC721Metadata.sol";
import "./IERC721Receiver.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

import { ERC165 } from "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "hardhat/console.sol";


contract MagicCard is IERC721, IERC721Metadata, IERC721Receiver, ERC165 {
    //события
    event TokenReceived(address operator, address from, uint256 tokenId, bytes data );
    event ReputationIncrease(address indexed to, uint indexed tokenID, string message );

    address owner; //владелец
    string tokenName;
    string tokenSymbol;

    using Strings for uint;    
    mapping(address => uint) _balances;
    mapping(uint => address) _owners;
    mapping(uint => address) _tokenApprovals;
    mapping(address => mapping(address => bool)) _operatorApprovals;

    //Описание токена и хранилище
    enum Elements { Jocker, Fire, Air, Aqua, Earth }
    string[5] elementsName = ["Jocker", "Fire", "Air", "Aqua", "Earth"];

    mapping(uint => uint) tokenRep;
    mapping(uint => Elements) tokenType;

    //оптимизация
    struct TokenDesc {        
        uint tokenId;
        Elements element;
        string elementName;
        uint rep;        
        string tokenURI;
    }    
    mapping(address => TokenDesc[])  tokenStorage;
    

    //Эмиссия, счетчики и аккумуляторы
    uint[5] public supply = [1, 111, 222, 333, 444]; //задаем значения максимального сапплая
    uint[5] _baseRep = [1000, 100, 75, 50, 25]; //задаем базовые значения репы

    uint[5] public currentSupply; // текущая эмиссия NFT каждого типа
    uint counterNFT; // счетчик выпущенных NFT
    uint totalRep; //аккумулятор репутации
    bool preMintFlag = false;

    //Цены wei
    uint public mintPrice = 100000000000000000;
    uint public repPrice = 200000000000000;

    //Модификаторы
    modifier onlyOwner() {
        require(msg.sender == owner, "not an owner");
        _;
    }
    modifier _requireMinted(uint tokenId) {
        require(_exists(tokenId), "not minted");
        _;
    }

    constructor() {
        tokenName = "MagicNFT";
        tokenSymbol = "MEL";
        owner = msg.sender;
    }

    //пробная функция - запись и чтнение в хранилище нового типа
    function createTokenDesc(uint tokenID, Elements element) public view returns(TokenDesc memory){ //сделать внутренней
        TokenDesc memory token;
        token.tokenId = tokenID;
        token.element = element;
        token.elementName = elementsName[uint(element)];
        token.rep = _baseRep[uint(element)];        
        token.tokenURI = "";
        
        return token;
    }

    function addNFT(address to, TokenDesc memory token) public { //удалить, техническая
        
        tokenStorage[to].push(token);

    }
    
    //геттеры для тестирования - УБРАТЬ!!!

    function getRep() public view returns (uint) {
        return totalRep;
    }

    //функции интерфейса IERC721
    function balanceOf(address _owner) public view returns (uint) {
        require(_owner != address(0), "zero address");

        return _balances[_owner];
    }

    function transferFrom(address from, address to, uint tokenId) public {
        require(
            _isApprovedOrOwner(msg.sender, tokenId),
            "not an owner or approved"
        );

        _transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint tokenId) public {
        require(
            _isApprovedOrOwner(msg.sender, tokenId),
            "not an owner or approved"
        );

        _safeTransfer(from, to, tokenId);
    }

    function approve(address to, uint tokenId) public {
        address _owner = ownerOf(tokenId);
        require(
            _owner == msg.sender || isApprovedForAll(_owner, msg.sender),
            "not an owner"
        );

        require(to != _owner, "cannot approve to self");

        _tokenApprovals[tokenId] = to;

        emit Approval(_owner, to, tokenId);
    }

    function ownerOf(uint tokenId ) public view _requireMinted(tokenId) returns (address) {
        return _owners[tokenId];
    }

    function isApprovedForAll(address _owner, address operator) public view returns (bool) {
        return _operatorApprovals[_owner][operator];
    }

    function getApproved(uint tokenId) public view _requireMinted(tokenId) returns (address) {
        return _tokenApprovals[tokenId];
    }

    function _safeTransfer(address from, address to, uint tokenId) internal {
        _transfer(from, to, tokenId);

        require(
            _checkOnERC721Received(from, to, tokenId),
            "non erc721 receiver"
        );
    }

    function _transfer(address from, address to, uint tokenId) internal {
        require(ownerOf(tokenId) == from, "not an owner");
        require(to != address(0), "to cannot be zero");

        _beforeTokenTransfer(from, to, tokenId);

        _balances[from]--;
        _balances[to]++;
        _owners[tokenId] = to;

        emit Transfer(from, to, tokenId);

        _afterTokenTransfer(from, to, tokenId);
    }

    function _isApprovedOrOwner(address spender, uint tokenId) internal view returns (bool) {
        address _owner = ownerOf(tokenId);

        require(
            spender == _owner ||
                isApprovedForAll(_owner, spender) ||
                getApproved(tokenId) == spender,
            "not an owner or approved"
        );
        return true;
    }

    function _exists(uint tokenId) internal view returns (bool) {
        return _owners[tokenId] != address(0);
    }

    function _beforeTokenTransfer(address from, address to, uint tokenId ) internal virtual {}

    function _afterTokenTransfer(address from, address to, uint tokenId ) internal virtual {}

    // Функции интерфейса IERC721Metadata

    /*function tokenURI(uint tokenId) public view virtual _requireMinted(tokenId) returns(string memory) {
        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, tokenId.toString())) : "";

    }    */

    //функции для владельца
    function withdrawAll(address payable recipient) external onlyOwner {
        uint minimumBalance = _calcMinimumBalance(); //сделaть функцию для расчета
        uint amount = address(this).balance - minimumBalance;
        recipient.transfer(amount);
    }

    function withdraw(uint amount, address payable recipient) external onlyOwner {
        uint minimumBalance = _calcMinimumBalance();
        uint maxAmount = address(this).balance - minimumBalance;
        require(amount <= maxAmount, "too much sum");
        recipient.transfer(amount);
    }

    function _calcMinimumBalance() public view onlyOwner returns (uint) {
        uint totalUserPrice;
        uint usersNFTCount;
        for (uint counter = 0; counter != counterNFT; ++counter) {
            if (ownerOf(counter) != address(this)) {
                totalUserPrice += getSellPrice(counter);
                ++usersNFTCount;
            }
        }
        uint estimatedGasCosts = 1657252749 * 30000000;
        totalUserPrice += estimatedGasCosts;
        return totalUserPrice;
    }

    function setTaskRep(uint tokenId, uint repReward, string memory message) external onlyOwner {
        tokenRep[tokenId] += repReward;
        totalRep += repReward; //накапливаем суммарную репутацию
        address recipient = _owners[tokenId];
        emit ReputationIncrease(recipient, tokenId, message);
    }

    function getBalance() external view returns (uint) {
        return address(this).balance;
    }

    //функции для статистики и отображения

    //геттеры для мэппингов и полей
    function getUserBalance(address user) external view returns (uint) {
        return _balances[user];
    }

    function getCountNFT() external view returns (uint) {
        return counterNFT;
    }

    function getMintPrice() public view returns (uint) {
        return mintPrice;
    }

    function getBuyPrice(uint tokenId) public view returns (uint) {
        return mintPrice + tokenRep[tokenId] * repPrice;
    }

    function getSellPrice(uint tokenId) public view returns (uint) {
        return mintPrice + tokenRep[tokenId] * repPrice - (mintPrice / 5); //20% дисконта к цене минта, но контракт покупает всю репу;
    }

    function tokenURI(uint tokenId) public view _requireMinted(tokenId) returns (string memory) {
        string memory _tokenURI = elementsName[uint(tokenType[tokenId])];

        string memory _base = _baseURI();

        if (bytes(_base).length == 0) {
            return _tokenURI;
        }
        if (bytes(_base).length > 0) {
            return string(abi.encodePacked(_base, _tokenURI));
        }

        return "";
    }

    function getDescription(uint tokenId) public view returns (string memory, uint) {
        string memory strElement = elementsName[uint(tokenType[tokenId])];
        uint rep = tokenRep[tokenId];
        return (strElement, rep);
    }

    function userNFTs(address user) public view returns (uint[] memory) {
        uint countNFT = _balances[user];
        uint[] memory userNFT = new uint256[](countNFT);

        uint i;
        for (uint counter = 0; counter != counterNFT; ++counter) {
            if (_owners[counter] == user) {
                userNFT[i] = counter;
                ++i;
            }
        }

        return userNFT;
    }

    //заготовка под оптимизацию
    /*function getDescription(uint tokenId) public returns(TokenDesc memory) {        
        
        return(tokenbStorage[tokenId]);
    }*/

    function isMintable() public view returns (bool) {
        return (counterNFT < _maxTotalSupply());
    }

    //функции для пользователя
    function mint() external payable {
        require(msg.value >= mintPrice, "not enough money");
        require(isMintable(), "mint is over");

        uint dropAmount = mintPrice / 5;
        _distributeAll(dropAmount);

        uint tokenId = counterNFT;
        counterNFT++;
        _createNewNFT(tokenId, msg.sender);
        _safeMint(msg.sender, tokenId);
    }

    function buyNFT(uint tokenId) external payable {
        uint price = getBuyPrice(tokenId);
        require(msg.value >= price, "not enough money");

        uint dropAmount = price / 3;
        _distributeAll(dropAmount);
        _repIncrease(tokenId);
        _safeTransfer(address(this), msg.sender, tokenId);
    }

    function sellNFT(uint tokenId) external {
        uint price = getSellPrice(tokenId);
        address payable seller = payable(msg.sender);

        _safeTransfer(seller, address(this), tokenId);
        //переводим деньги
        seller.transfer(price);
    }

    function burn(uint tokenId) public {
        _safeTransfer(msg.sender, address(this), tokenId);
    }

    //служебные функции

    receive() external payable {
        revert("please use the buy or mint functions to purchase NFT");
    }

    fallback() external {
        console.logBytes(msg.data);
    }

    function preMint() public {
        require(!preMintFlag, "can't premint twice");
        //первоначальная эмиссия
        //минтим на баланс контракта 1 джокера и по 10% каждого типа NFT
        address self = address(this);
        //Джокер
        currentSupply[uint(Elements.Jocker)]++;
        _createNewNFT(0, Elements.Jocker);
        _mint(self, counterNFT);
        ++counterNFT;
        //Остальные
        for (uint i = 1; i <= 4; ++i) {
            Elements element = Elements(i);
            uint count = supply[uint(element)] / 10;
            for (uint j = 0; j != count; ++j) {
                currentSupply[uint(element)]++;
                _createNewNFT(counterNFT, element);
                _mint(self, counterNFT);
                ++counterNFT;
            }
        }
        preMintFlag = true;
    }

    function _maxTotalSupply() internal view returns (uint) {
        uint maxSupply;
        for (uint counter = 0; counter != supply.length; ++counter) {
            maxSupply += supply[counter];
        }
        return maxSupply;
    }

    function _calculateRandomElement(
        uint tokenId,
        address recipient
    ) internal view returns (Elements) {
        uint[5] memory limits;
        for (uint counter = 1; counter != 5; ++counter) {
            limits[counter] = supply[counter] - currentSupply[counter];
        }

        uint random = uint(
            keccak256(abi.encodePacked(block.timestamp, recipient, tokenId))
        ) % _maxTotalSupply();
        Elements element = Elements.Earth;

        for (uint counter = 1; counter < 5; ++counter) {
            if (random <= (limits[counter - 1] + limits[counter])) {
                element = Elements(counter);
                counter = 5;
            }
        }
        return element;
    }

    function _repIncrease(uint tokenId) internal {
        uint repInc = _baseRep[uint(tokenType[tokenId])] / 10; //за каждую простую операцию добавляем 10% базовой репы
        tokenRep[tokenId] += repInc;
        tokenRep[0] += repInc; //Джокер всегда получает премию
        totalRep += (2 * repInc); //аккумулируем репутацию
    }

    function _createNewNFT(uint tokenId, address recipient) internal {
        Elements element = _calculateRandomElement(tokenId, recipient);
        tokenType[tokenId] = element;
        tokenRep[tokenId] = _baseRep[uint(element)];
        totalRep += _baseRep[uint(element)]; //накапливаем суммарную репутацию
    }

    function _createNewNFT(uint tokenId, Elements element) internal {
        tokenType[tokenId] = element;
        tokenRep[tokenId] = _baseRep[uint(element)];
        totalRep += _baseRep[uint(element)]; //накапливаем суммарную репутацию
    }

    function _distributeAll(uint dropAmount) internal {
        uint dropOnRep = dropAmount / (totalRep != 0 ? totalRep : 1);

        //пересмотреть хранилище и возможно переделать этот цикл
        for (uint counter = 0; counter != counterNFT; ++counter) {
            if (_owners[counter] != address(this)) {
                uint drop = dropOnRep * tokenRep[counter];
                address payable recipient = payable(_owners[counter]);
                recipient.transfer(drop);
            }
        }
    }

    //  разобрать
    function _baseURI() internal pure virtual returns (string memory) {
        return "";
    }

    function _safeMint(address to, uint tokenID) internal virtual {
        _mint(to, tokenID);

        require(
            _checkOnERC721Received(msg.sender, to, tokenID),
            "non erc721 receiver"
        );
    }

    function _mint(address to, uint tokenID) internal virtual {
        require(to != address(0), "to cannot be zero");
        require(!_exists(tokenID), "already exists");

        _owners[tokenID] = to;
        _balances[to]++;
    }

    function _checkOnERC721Received(
        address from,
        address to,
        uint tokenId
    ) private returns (bool) {
        if (to.code.length > 0) {
            try
                IERC721Receiver(to).onERC721Received(
                    msg.sender,
                    from,
                    tokenId,
                    bytes("")
                )
            returns (bytes4 ret) {
                return ret == IERC721Receiver.onERC721Received.selector;
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert("Non erc721 reciver");
                } else {
                    assembly {
                        revert(add(32, reason), mload(reason))
                    }
                }
            }
        } else {
            return true;
        }
    }

    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external override returns (bytes4) {
        // Логируем или обрабатываем информацию о переданном токене
        emit TokenReceived(operator, from, tokenId, data);
        // Возвращаем селектор функции, который подтверждает успешную обработку
        return this.onERC721Received.selector;
    }

    function safeTransferFrom(address from, address to, uint tokenId, bytes calldata data) external override {}

    function transferFrom(address from, address to, uint tokenId, bytes calldata data) external override {}

    function setApprovalForAll(address operator, bool approved ) external override {}

    function name() external view  override returns (string memory) {
        return tokenName;
    }

    function symbol() external view override returns (string memory) {
        return tokenSymbol;
    } 
}