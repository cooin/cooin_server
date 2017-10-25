-- phpMyAdmin SQL Dump
-- version 4.6.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Dec 14, 2016 at 07:01 AM
-- Server version: 5.7.14
-- PHP Version: 5.6.24

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+08:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `bitkuang`
--

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `password_login` char(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_safe` char(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_login` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `refer_code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `mobile` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mobile_country` char(4) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_mobile_mobile_country_unique` (`mobile`,`mobile_country`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `users`
--

-- phpMyAdmin SQL Dump
-- version 3.5.1
-- http://www.phpmyadmin.net
--
-- 主机: localhost
-- 生成日期: 2016 年 12 月 15 日 01:59
-- 服务器版本: 5.5.24-log
-- PHP 版本: 5.3.13

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- 数据库: `backup_btk`
--

-- --------------------------------------------------------

--
-- 表的结构 `borrowlist`
--

CREATE TABLE IF NOT EXISTS `borrowlist` (
  `id` int(12) NOT NULL AUTO_INCREMENT,
  `username` varchar(30) CHARACTER SET utf8 NOT NULL DEFAULT '',
  `borrowid` bigint(16) NOT NULL DEFAULT '0',
  `shibiepass` bigint(10) NOT NULL,
  `rmb_balance` double NOT NULL DEFAULT '0',
  `btc_balance` double NOT NULL DEFAULT '0',
  `bt2_balance` double NOT NULL DEFAULT '0',
  `bt3_balance` double NOT NULL DEFAULT '0',
  `bt4_balance` double NOT NULL DEFAULT '0',
  `rmb_balance_f` double NOT NULL DEFAULT '0',
  `btc_balance_f` double NOT NULL DEFAULT '0',
  `bt2_balance_f` double NOT NULL DEFAULT '0',
  `bt3_balance_f` double NOT NULL DEFAULT '0',
  `bt4_balance_f` double NOT NULL DEFAULT '0',
  `borrowcurrencytype` varchar(20) CHARACTER SET utf8 NOT NULL DEFAULT '',
  `period` int(5) NOT NULL DEFAULT '0',
  `totalborrow` double NOT NULL DEFAULT '0',
  `nowborrow` double NOT NULL,
  `totalreturn` double NOT NULL DEFAULT '0',
  `daylilv` double NOT NULL DEFAULT '0',
  `guartotal` double NOT NULL DEFAULT '0',
  `guarcurrency` varchar(5) NOT NULL,
  `guartotalbyborrow` double NOT NULL DEFAULT '0',
  `guarpercent` varchar(10) CHARACTER SET utf8 NOT NULL DEFAULT '',
  `guardeal` varchar(5) NOT NULL DEFAULT '0',
  `qiangpinline` double NOT NULL DEFAULT '0',
  `applydate` varchar(35) CHARACTER SET utf8 NOT NULL DEFAULT '',
  `applydateday` varchar(35) NOT NULL,
  `mujideadline` varchar(35) CHARACTER SET utf8 NOT NULL DEFAULT '',
  `returntime` varchar(35) CHARACTER SET utf8 NOT NULL DEFAULT '',
  `returntimeforinvest` bigint(16) NOT NULL,
  `totalprofit` double NOT NULL DEFAULT '0',
  `moneybackdate` varchar(35) NOT NULL,
  `totallixi` double NOT NULL,
  `profitpercent` double NOT NULL DEFAULT '0',
  `status` varchar(30) CHARACTER SET utf8 NOT NULL DEFAULT '',
  `sysinput` int(2) NOT NULL DEFAULT '0',
  `admintxt` varchar(50) CHARACTER SET utf8 DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `status` (`status`),
  KEY `borrowid` (`borrowid`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=131 ;

-- --------------------------------------------------------

--
-- 表的结构 `count_orderid`
--

CREATE TABLE IF NOT EXISTS `count_orderid` (
  `id` tinyint(8) NOT NULL DEFAULT '0',
  `count` bigint(20) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- 表的结构 `master_register`
--

CREATE TABLE IF NOT EXISTS `master_register` (
  `id` int(12) NOT NULL AUTO_INCREMENT,
  `username` varchar(30) NOT NULL DEFAULT '',
  `password` varchar(20) NOT NULL DEFAULT '',
  `dealpassword` varchar(20) NOT NULL DEFAULT '',
  `shibiepass` bigint(10) NOT NULL,
  `email` varchar(60) NOT NULL DEFAULT '',
  `realname` varchar(30) NOT NULL DEFAULT '',
  `tel` varchar(20) NOT NULL DEFAULT '',
  `country` varchar(20) NOT NULL DEFAULT '',
  `state` varchar(20) NOT NULL DEFAULT '',
  `city` varchar(20) NOT NULL DEFAULT '',
  `homeaddress` varchar(120) NOT NULL DEFAULT '',
  `zip` varchar(30) NOT NULL DEFAULT '',
  `drawstate` varchar(30) NOT NULL DEFAULT '',
  `drawcity` varchar(30) NOT NULL DEFAULT '',
  `ipcity` varchar(30) NOT NULL DEFAULT '',
  `qq` varchar(20) NOT NULL DEFAULT '',
  `refer` varchar(30) NOT NULL DEFAULT '',
  `referbonuspaid` varchar(2) NOT NULL DEFAULT '0',
  `question` varchar(150) NOT NULL DEFAULT '',
  `answer` varchar(150) NOT NULL DEFAULT '',
  `joindate` varchar(20) NOT NULL DEFAULT '',
  `paymode` varchar(20) NOT NULL DEFAULT '',
  `bankname` varchar(80) NOT NULL DEFAULT '',
  `alipay` varchar(100) NOT NULL DEFAULT '',
  `btc_address` varchar(100) NOT NULL DEFAULT '',
  `bt2_address` varchar(100) NOT NULL DEFAULT '',
  `bt2_address_id` varchar(9) NOT NULL DEFAULT '1',
  `bt3_address` varchar(100) NOT NULL DEFAULT '',
  `bt4_address` varchar(100) NOT NULL DEFAULT '',
  `rmb_balance_f` double NOT NULL DEFAULT '0',
  `btc_balance_f` double NOT NULL DEFAULT '0',
  `bt2_balance_f` double NOT NULL DEFAULT '0',
  `bt3_balance_f` double NOT NULL DEFAULT '0',
  `bt4_balance_f` double NOT NULL DEFAULT '0',
  `score` double NOT NULL DEFAULT '0',
  `banknumber` varchar(80) NOT NULL DEFAULT '',
  `zhihang` varchar(100) NOT NULL DEFAULT '',
  `paycomment` varchar(200) NOT NULL DEFAULT '',
  `promotecode` varchar(20) NOT NULL DEFAULT '',
  `cancelmember` int(5) NOT NULL DEFAULT '0',
  `rmb_balance` double NOT NULL DEFAULT '0',
  `btc_balance` double NOT NULL DEFAULT '0',
  `bt2_balance` double NOT NULL DEFAULT '0',
  `bt3_balance` double NOT NULL DEFAULT '0',
  `bt4_balance` double NOT NULL DEFAULT '0',
  `allincome` double NOT NULL DEFAULT '0',
  `withdrawinfo` varchar(5) NOT NULL DEFAULT '0',
  `experienced` varchar(5) NOT NULL DEFAULT '0',
  `investmember` char(2) NOT NULL DEFAULT '0',
  `regip` varchar(18) NOT NULL DEFAULT '',
  `activecode` varchar(18) NOT NULL DEFAULT '',
  `regallinfo` varchar(200) NOT NULL DEFAULT '',
  `refertxt` varchar(45) NOT NULL DEFAULT '',
  `allpay` double NOT NULL DEFAULT '0',
  `alldraw` double NOT NULL DEFAULT '0',
  `allwin` double NOT NULL DEFAULT '0',
  `allconsume` double NOT NULL DEFAULT '0',
  `shouldreturn` double NOT NULL DEFAULT '0',
  `onlinesupport` int(2) NOT NULL DEFAULT '0',
  `allrefer` int(6) NOT NULL DEFAULT '0',
  `allreferfund` int(9) NOT NULL DEFAULT '0',
  `allorder` int(6) NOT NULL DEFAULT '0',
  `totaldeal` double NOT NULL DEFAULT '0',
  `totalborrow` double NOT NULL DEFAULT '0',
  `totalinvestwin` double NOT NULL DEFAULT '0',
  `lastdealdate` bigint(12) NOT NULL,
  `howmanydeal` int(4) NOT NULL,
  `lastlogintime` varchar(35) NOT NULL DEFAULT '',
  `frozedata` varchar(50) NOT NULL,
  `getbackpasstime` varchar(20) NOT NULL DEFAULT '',
  `sysinput` int(2) NOT NULL DEFAULT '0',
  `adminlimit` varchar(20) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `realname` (`realname`),
  KEY `refer` (`refer`),
  KEY `allorder` (`allorder`),
  KEY `username_2` (`username`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=10246 ;

-- --------------------------------------------------------

--
-- 表的结构 `orderlist_bid`
--

CREATE TABLE IF NOT EXISTS `orderlist_bid` (
  `id` int(12) NOT NULL AUTO_INCREMENT,
  `username` varchar(30) NOT NULL DEFAULT '',
  `orderid` bigint(20) NOT NULL DEFAULT '0',
  `bors` char(2) NOT NULL DEFAULT '',
  `orderdate` varchar(20) NOT NULL DEFAULT '',
  `orderdatedetail` varchar(20) NOT NULL DEFAULT '',
  `curr_type` varchar(10) NOT NULL,
  `moneyfrom` varchar(5) NOT NULL,
  `borrowid` bigint(16) NOT NULL DEFAULT '0',
  `bidprice` double NOT NULL DEFAULT '0',
  `quantity` double NOT NULL DEFAULT '0',
  `nowquantity` double NOT NULL DEFAULT '0',
  `total` double NOT NULL DEFAULT '0',
  `nowdealtotal` double NOT NULL DEFAULT '0',
  `status` int(2) NOT NULL DEFAULT '0',
  `feebonus` int(2) NOT NULL DEFAULT '0',
  `valuedate` varchar(20) NOT NULL,
  `cancelorder` char(2) NOT NULL DEFAULT '',
  `canceldate` varchar(20) NOT NULL DEFAULT '',
  `admintxt` varchar(150) NOT NULL DEFAULT '',
  `sysinput` int(2) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `username` (`username`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=102535 ;

-- --------------------------------------------------------

--
-- 表的结构 `realtimeprice`
--

CREATE TABLE IF NOT EXISTS `realtimeprice` (
  `id` int(8) NOT NULL AUTO_INCREMENT,
  `currencytype` int(6) NOT NULL DEFAULT '0',
  `syndate` bigint(20) NOT NULL DEFAULT '0',
  `lastprice` float NOT NULL DEFAULT '0',
  `buy` float NOT NULL,
  `sell` float NOT NULL,
  `low` float NOT NULL,
  `high` float NOT NULL,
  `vol` float NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=76555 ;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

alter table accountborrowlist convert to character set utf8mb4 collate utf8mb4_general_ci;

alter table count_orderid convert to character set utf8mb4 collate utf8mb4_general_ci;

alter table master_register convert to character set utf8mb4 collate utf8mb4_general_ci;

alter table orderlist_bid convert to character set utf8mb4 collate utf8mb4_general_ci;

alter table realtimeprice convert to character set utf8mb4 collate utf8mb4_general_ci;


CREATE TABLE `orderlist_bid_log` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `sellOrderId` bigint(20) NOT NULL,
  `buyOrderId` bigint(20) NOT NULL,
  `quantity` double NOT NULL DEFAULT '0',
  `transPrice` double NOT NULL DEFAULT '0',
  `total` double NOT NULL DEFAULT '0',
  `createdAt` timestamp NULL DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT NULL,
  `deletedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=51436 DEFAULT CHARSET=utf8mb4;

CREATE TABLE `realtimeprice_log` (
  `id` int(8) NOT NULL AUTO_INCREMENT,
  `currencytype` int(6) NOT NULL DEFAULT '0',
  `syndate` bigint(20) NOT NULL DEFAULT '0',
  `lastprice` float NOT NULL DEFAULT '0',
  `buy` float NOT NULL,
  `sell` float NOT NULL,
  `low` float NOT NULL,
  `high` float NOT NULL,
  `vol` float NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14241 DEFAULT CHARSET=utf8mb4;

CREATE TABLE `fund_in_out` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `username` varchar(30) NOT NULL DEFAULT '',
  `fundmoneystatus` varchar(20) NOT NULL DEFAULT '',
  `curr_type` int(2) NOT NULL,
  `addorminus` varchar(20) NOT NULL DEFAULT '',
  `actiondate` varchar(20) NOT NULL DEFAULT '',
  `paymode` varchar(20) NOT NULL DEFAULT '',
  `borrowid` bigint(16) NOT NULL,
  `price` double NOT NULL,
  `quantity` double NOT NULL,
  `money` double NOT NULL,
  `playuser` varchar(30) NOT NULL DEFAULT '',
  `orderid` bigint(30) NOT NULL,
  `admintxt` varchar(200) NOT NULL DEFAULT '',
  `valuedate` varchar(20) NOT NULL DEFAULT '',
  `createdAt` timestamp NULL DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT NULL,
  `deletedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `username` (`username`),
  KEY `fundmoneystatus` (`fundmoneystatus`)
) ENGINE=InnoDB AUTO_INCREMENT=15441 DEFAULT CHARSET=utf8mb4;
